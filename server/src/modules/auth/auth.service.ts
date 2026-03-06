import { Injectable, BadRequestException, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Redis from 'ioredis';
import { User, UserStatus } from '../user/entities/user.entity';
import { VerificationCode } from '../user/entities/verification-code.entity';
import { SendCodeDto, LoginDto, RefreshTokenDto } from './dto';

/**
 * 认证服务
 * 实现验证码发送、登录验证、JWT Token 管理
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private redis: Redis;

  // Redis 键前缀
  private readonly CODE_PREFIX = 'auth:code:';
  private readonly RATE_LIMIT_PREFIX = 'auth:rate:';
  private readonly ATTEMPT_PREFIX = 'auth:attempt:';
  private readonly BLACKLIST_PREFIX = 'auth:blacklist:';

  // 配置常量
  private readonly CODE_EXPIRY = 300; // 验证码有效期：5分钟
  private readonly RATE_LIMIT_SECONDS = 60; // 发送限流：60秒
  private readonly MAX_ATTEMPTS = 3; // 最大尝试次数
  private readonly ATTEMPT_LOCK_SECONDS = 300; // 锁定时间：5分钟
  private readonly TOKEN_EXPIRY = 7 * 24 * 60 * 60; // Token有效期：7天（秒）

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(VerificationCode)
    private codeRepository: Repository<VerificationCode>,
  ) {
    // 初始化 Redis 连接 - 支持 Upstash 云部署
    const redisUrl = this.configService.get<string>('REDIS_URL');

    if (redisUrl) {
      // 云部署使用 URL 连接（Upstash 需要 TLS）
      this.redis = new Redis(redisUrl, {
        tls: {
          rejectUnauthorized: false,
        },
      });
    } else {
      // 本地开发使用分离配置
      this.redis = new Redis({
        host: this.configService.get<string>('REDIS_HOST', 'localhost'),
        port: this.configService.get<number>('REDIS_PORT', 6379),
      });
    }

    this.redis.on('connect', () => {
      this.logger.log('Redis connected successfully');
    });

    this.redis.on('error', (err) => {
      this.logger.error('Redis connection error:', err.message);
    });
  }

  /**
   * 发送验证码
   * 1. 校验手机号格式（DTO 层已完成）
   * 2. 检查发送频率限制
   * 3. 生成验证码
   * 4. 存储到 Redis
   * 5. 调用短信服务发送（Mock）
   */
  async sendCode(dto: SendCodeDto): Promise<{ success: boolean; message: string; expiresIn: number }> {
    const { phone, scene } = dto;

    // 检查发送频率限制
    const rateLimitKey = this.RATE_LIMIT_PREFIX + phone;
    const rateLimited = await this.redis.get(rateLimitKey);
    if (rateLimited) {
      const ttl = await this.redis.ttl(rateLimitKey);
      throw new BadRequestException({
        code: 'AUTH_CODE_TOO_FREQUENT',
        message: `发送过于频繁，请${ttl}秒后重试`,
      });
    }

    // 生成 6 位数字验证码
    const code = this.generateCode();

    // 存储验证码到 Redis
    const codeKey = this.CODE_PREFIX + phone;
    await this.redis.setex(codeKey, this.CODE_EXPIRY, code);

    // 设置发送频率限制
    await this.redis.setex(rateLimitKey, this.RATE_LIMIT_SECONDS, '1');

    // 存储到数据库（用于审计）
    const verificationCode = this.codeRepository.create({
      phone,
      code,
      expiresAt: new Date(Date.now() + this.CODE_EXPIRY * 1000),
    });
    await this.codeRepository.save(verificationCode);

    // 发送短信（Mock 实现）
    await this.sendSms(phone, code, scene);

    this.logger.log(`Verification code sent to ${phone}, scene: ${scene}`);

    return {
      success: true,
      message: '验证码已发送',
      expiresIn: this.CODE_EXPIRY,
    };
  }

  /**
   * 验证码登录/注册
   * 1. 检查尝试次数限制
   * 2. 验证验证码
   * 3. 查找或创建用户
   * 4. 生成 JWT Token
   */
  async login(dto: LoginDto): Promise<{
    success: boolean;
    data: {
      user: User;
      token: string;
      expiresIn: number;
      isNewUser: boolean;
    };
  }> {
    const { phone, code } = dto;

    // 检查尝试次数限制
    const attemptKey = this.ATTEMPT_PREFIX + phone;
    const attempts = await this.redis.get(attemptKey);
    if (attempts && parseInt(attempts) >= this.MAX_ATTEMPTS) {
      const ttl = await this.redis.ttl(attemptKey);
      throw new BadRequestException({
        code: 'TOO_MANY_ATTEMPTS',
        message: `尝试次数过多，请${ttl}秒后重试`,
      });
    }

    // 验证验证码
    const codeKey = this.CODE_PREFIX + phone;
    const storedCode = await this.redis.get(codeKey);

    if (!storedCode) {
      throw new BadRequestException({
        code: 'AUTH_CODE_EXPIRED',
        message: '验证码已过期',
      });
    }

    if (storedCode !== code) {
      // 增加尝试次数
      const newAttempts = await this.redis.incr(attemptKey);
      if (newAttempts === 1) {
        await this.redis.expire(attemptKey, this.ATTEMPT_LOCK_SECONDS);
      }

      throw new BadRequestException({
        code: 'AUTH_CODE_INVALID',
        message: `验证码错误，剩余${this.MAX_ATTEMPTS - newAttempts}次机会`,
      });
    }

    // 验证成功，删除验证码和尝试记录
    await this.redis.del(codeKey);
    await this.redis.del(attemptKey);

    // 查找或创建用户
    let user = await this.userRepository.findOne({
      where: { phone },
    });

    let isNewUser = false;
    if (!user) {
      // 新用户自动注册
      user = this.userRepository.create({
        phone,
        status: UserStatus.ACTIVE,
      });
      await this.userRepository.save(user);
      isNewUser = true;
      this.logger.log(`New user registered: ${phone}`);
    } else {
      // 更新登录时间
      user.lastLoginAt = new Date();
      await this.userRepository.save(user);
      this.logger.log(`User logged in: ${phone}`);
    }

    // 生成 JWT Token
    const token = await this.generateToken(user);
    const expiresIn = this.TOKEN_EXPIRY;

    return {
      success: true,
      data: {
        user,
        token,
        expiresIn,
        isNewUser,
      },
    };
  }

  /**
   * 刷新 Token
   */
  async refreshToken(dto: RefreshTokenDto): Promise<{
    success: boolean;
    data: {
      token: string;
      expiresIn: number;
    };
  }> {
    const { token } = dto;

    // 检查是否在黑名单中
    const blacklisted = await this.redis.get(this.BLACKLIST_PREFIX + token);
    if (blacklisted) {
      throw new UnauthorizedException({
        code: 'AUTH_TOKEN_INVALID',
        message: 'Token已失效',
      });
    }

    try {
      // 验证旧 Token
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      // 查找用户
      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException({
          code: 'AUTH_UNAUTHORIZED',
          message: '用户不存在',
        });
      }

      // 生成新 Token
      const newToken = await this.generateToken(user);
      const expiresIn = this.TOKEN_EXPIRY;

      return {
        success: true,
        data: {
          token: newToken,
          expiresIn,
        },
      };
    } catch (error) {
      throw new UnauthorizedException({
        code: 'AUTH_TOKEN_EXPIRED',
        message: 'Token已过期',
      });
    }
  }

  /**
   * 获取当前用户
   */
  async getCurrentUser(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException({
        code: 'AUTH_UNAUTHORIZED',
        message: '用户不存在',
      });
    }

    return user;
  }

  /**
   * 登出（将 Token 加入黑名单）
   */
  async logout(token: string): Promise<{ success: boolean }> {
    try {
      // 解析 Token 获取过期时间
      const payload = this.jwtService.decode(token) as any;
      if (payload && payload.exp) {
        const ttl = payload.exp - Math.floor(Date.now() / 1000);
        if (ttl > 0) {
          // 将 Token 加入黑名单，过期时间为 Token 剩余有效期
          await this.redis.setex(this.BLACKLIST_PREFIX + token, ttl, '1');
        }
      }
    } catch (error) {
      this.logger.error('Logout error:', error.message);
    }

    return { success: true };
  }

  /**
   * 生成 6 位数字验证码
   */
  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * 生成 JWT Token
   */
  private async generateToken(user: User): Promise<string> {
    const payload = {
      sub: user.id,
      phone: user.phone,
    };

    return this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.TOKEN_EXPIRY,
    });
  }

  /**
   * 发送短信（Mock 实现）
   * TODO: 后续集成短信服务商（阿里云/腾讯云）
   */
  private async sendSms(phone: string, code: string, scene: string): Promise<void> {
    // Mock 实现：直接打印日志
    this.logger.log(`[MOCK SMS] Sending code ${code} to ${phone}, scene: ${scene}`);

    // TODO: 实际短信发送逻辑
    // const smsService = this.configService.get('SMS_SERVICE');
    // if (smsService === 'aliyun') {
    //   await this.aliyunSmsService.send(phone, code, scene);
    // } else if (smsService === 'tencent') {
    //   await this.tencentSmsService.send(phone, code, scene);
    // }
  }
}