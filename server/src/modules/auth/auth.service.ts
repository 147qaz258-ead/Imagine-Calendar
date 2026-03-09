import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import Redis from 'ioredis'
import * as bcrypt from 'bcryptjs'
import { User, UserStatus } from '../user/entities/user.entity'
import { VerificationCode } from '../user/entities/verification-code.entity'
import { SendCodeDto, LoginDto, RefreshTokenDto, RegisterDto, PasswordLoginDto } from './dto'
import { InviteCodeService } from '../invite-code/invite-code.service'
import { RoundTableService } from '../roundtable/roundtable.service'

/**
 * 用户响应类型（不包含密码）
 */
type UserResponse = Omit<User, 'password'>

/**
 * 内存缓存项
 */
interface MemoryCacheItem {
  value: string
  expiresAt: number
}

/**
 * 认证服务
 * 实现验证码发送、登录验证、JWT Token 管理
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)
  private redis: Redis | null = null
  private redisAvailable = false

  // 内存缓存（Redis 不可用时的降级方案）
  private memoryCache = new Map<string, MemoryCacheItem>()

  // Redis 键前缀
  private readonly CODE_PREFIX = 'auth:code:'
  private readonly RATE_LIMIT_PREFIX = 'auth:rate:'
  private readonly ATTEMPT_PREFIX = 'auth:attempt:'
  private readonly BLACKLIST_PREFIX = 'auth:blacklist:'
  private readonly PASSWORD_ATTEMPT_PREFIX = 'auth:pwd_attempt:'

  // 配置常量
  private readonly CODE_EXPIRY = 300 // 验证码有效期：5分钟
  private readonly RATE_LIMIT_SECONDS = 60 // 发送限流：60秒
  private readonly MAX_ATTEMPTS = 3 // 最大尝试次数
  private readonly ATTEMPT_LOCK_SECONDS = 300 // 锁定时间：5分钟
  private readonly TOKEN_EXPIRY = 7 * 24 * 60 * 60 // Token有效期：7天（秒）
  private readonly BCRYPT_SALT_ROUNDS = 10 // bcrypt 加密轮数
  private readonly MAX_PASSWORD_ATTEMPTS = 5 // 密码登录最大尝试次数
  private readonly PASSWORD_LOCK_SECONDS = 900 // 密码错误锁定时间：15分钟

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(VerificationCode)
    private codeRepository: Repository<VerificationCode>,
    @Inject(forwardRef(() => InviteCodeService))
    private inviteCodeService: InviteCodeService,
    @Inject(forwardRef(() => RoundTableService))
    private roundTableService: RoundTableService,
  ) {
    // 初始化 Redis 连接 - 支持 Upstash 云部署
    this.initRedis()
  }

  /**
   * 初始化 Redis 连接
   */
  private initRedis() {
    const redisUrl = this.configService.get<string>('REDIS_URL')
    const redisHost = this.configService.get<string>('REDIS_HOST')

    // 如果没有配置 Redis，使用内存缓存
    if (!redisUrl && !redisHost) {
      this.logger.warn('Redis not configured, using memory cache for verification codes')
      this.redisAvailable = false
      return
    }

    const redisOptions = {
      connectTimeout: 5000, // 连接超时 5 秒
      commandTimeout: 3000, // 命令超时 3 秒
      maxRetriesPerRequest: 2, // 每个命令最多重试 2 次
      retryStrategy: (times: number) => {
        if (times > 2) {
          this.logger.error('Redis connection failed after 2 retries, falling back to memory cache')
          this.redisAvailable = false
          return null // 停止重试
        }
        return Math.min(times * 100, 1000) // 重试延迟
      },
    }

    try {
      if (redisUrl) {
        // 云部署使用 URL 连接（Upstash 需要 TLS）
        this.redis = new Redis(redisUrl, {
          ...redisOptions,
          tls: {
            rejectUnauthorized: false,
          },
        })
      } else {
        // 本地开发使用分离配置
        this.redis = new Redis({
          host: redisHost,
          port: this.configService.get<number>('REDIS_PORT', 6379),
          ...redisOptions,
        })
      }

      this.redis.on('connect', () => {
        this.logger.log('Redis connected successfully')
        this.redisAvailable = true
      })

      this.redis.on('error', (err) => {
        this.logger.error('Redis connection error:', err.message)
        this.redisAvailable = false
      })

      this.redis.on('close', () => {
        this.logger.warn('Redis connection closed')
        this.redisAvailable = false
      })
    } catch (error) {
      this.logger.error('Failed to initialize Redis:', error)
      this.redisAvailable = false
    }
  }

  /**
   * 设置缓存值（Redis 或内存）
   */
  private async setCache(key: string, value: string, ttl: number): Promise<void> {
    if (this.redisAvailable && this.redis) {
      try {
        await this.redis.setex(key, ttl, value)
        return
      } catch {
        this.logger.warn('Redis setex failed, falling back to memory cache')
      }
    }
    // 内存缓存降级
    this.memoryCache.set(key, {
      value,
      expiresAt: Date.now() + ttl * 1000,
    })
  }

  /**
   * 获取缓存值（Redis 或内存）
   */
  private async getCache(key: string): Promise<string | null> {
    if (this.redisAvailable && this.redis) {
      try {
        const value = await Promise.race([
          this.redis.get(key),
          new Promise<null>((_, reject) =>
            setTimeout(() => reject(new Error('Redis timeout')), 3000),
          ),
        ])
        return value
      } catch {
        this.logger.warn('Redis get failed, falling back to memory cache')
      }
    }
    // 内存缓存降级
    const item = this.memoryCache.get(key)
    if (item && item.expiresAt > Date.now()) {
      return item.value
    }
    if (item) {
      this.memoryCache.delete(key) // 清除过期项
    }
    return null
  }

  /**
   * 删除缓存值（Redis 或内存）
   */
  private async deleteCache(key: string): Promise<void> {
    if (this.redisAvailable && this.redis) {
      try {
        await this.redis.del(key)
      } catch {
        this.logger.warn('Redis del failed')
      }
    }
    this.memoryCache.delete(key)
  }

  /**
   * 增加计数器（Redis 或内存）
   */
  private async incrementCache(key: string, ttl: number): Promise<number> {
    if (this.redisAvailable && this.redis) {
      try {
        const value = await this.redis.incr(key)
        if (value === 1) {
          await this.redis.expire(key, ttl)
        }
        return value
      } catch {
        this.logger.warn('Redis incr failed, falling back to memory cache')
      }
    }
    // 内存缓存降级 - 简化实现
    const item = this.memoryCache.get(key)
    const newValue = item ? parseInt(item.value) + 1 : 1
    this.memoryCache.set(key, {
      value: String(newValue),
      expiresAt: Date.now() + ttl * 1000,
    })
    return newValue
  }

  /**
   * 获取 TTL（Redis 或内存）
   */
  private async getTtl(key: string): Promise<number> {
    if (this.redisAvailable && this.redis) {
      try {
        return await this.redis.ttl(key)
      } catch {
        this.logger.warn('Redis ttl failed')
      }
    }
    const item = this.memoryCache.get(key)
    if (item && item.expiresAt > Date.now()) {
      return Math.floor((item.expiresAt - Date.now()) / 1000)
    }
    return -1
  }

  /**
   * 发送验证码
   * 1. 校验手机号格式（DTO 层已完成）
   * 2. 检查发送频率限制
   * 3. 生成验证码
   * 4. 存储到缓存
   * 5. 调用短信服务发送（Mock）
   */
  async sendCode(dto: SendCodeDto): Promise<{
    success: boolean
    message: string
    data: { expiresIn: number; code?: string }
  }> {
    const { phone, scene } = dto

    // 检查发送频率限制
    const rateLimitKey = this.RATE_LIMIT_PREFIX + phone
    const rateLimited = await this.getCache(rateLimitKey)
    if (rateLimited) {
      const ttl = await this.getTtl(rateLimitKey)
      throw new BadRequestException({
        code: 'AUTH_CODE_TOO_FREQUENT',
        message: `发送过于频繁，请${ttl}秒后重试`,
      })
    }

    // 生成 6 位数字验证码
    const code = this.generateCode()

    // 存储验证码到缓存
    const codeKey = this.CODE_PREFIX + phone
    await this.setCache(codeKey, code, this.CODE_EXPIRY)

    // 设置发送频率限制
    await this.setCache(rateLimitKey, '1', this.RATE_LIMIT_SECONDS)

    // 存储到数据库（用于审计）
    const verificationCode = this.codeRepository.create({
      phone,
      code,
      expiresAt: new Date(Date.now() + this.CODE_EXPIRY * 1000),
    })
    await this.codeRepository.save(verificationCode)

    // 发送短信（Mock 实现）
    await this.sendSms(phone, code, scene)

    this.logger.log(`Verification code sent to ${phone}, scene: ${scene}`)

    // 非生产环境返回验证码（用于测试）
    const nodeEnv = this.configService.get<string>('NODE_ENV')
    const isProduction = nodeEnv === 'production'

    return {
      success: true,
      message: '验证码已发送',
      data: {
        expiresIn: this.CODE_EXPIRY,
        // 开发/测试环境返回验证码，方便测试
        ...(isProduction ? {} : { code }),
      },
    }
  }

  /**
   * 验证码登录/注册
   * 1. 检查尝试次数限制
   * 2. 验证验证码
   * 3. 查找或创建用户
   * 4. 生成 JWT Token
   */
  async login(dto: LoginDto): Promise<{
    success: boolean
    data: {
      user: User
      token: string
      expiresIn: number
      isNewUser: boolean
    }
  }> {
    const { phone, code } = dto

    // 检查尝试次数限制
    const attemptKey = this.ATTEMPT_PREFIX + phone
    const attempts = await this.getCache(attemptKey)
    if (attempts && parseInt(attempts) >= this.MAX_ATTEMPTS) {
      const ttl = await this.getTtl(attemptKey)
      throw new BadRequestException({
        code: 'TOO_MANY_ATTEMPTS',
        message: `尝试次数过多，请${ttl}秒后重试`,
      })
    }

    // 验证验证码
    const codeKey = this.CODE_PREFIX + phone
    const storedCode = await this.getCache(codeKey)

    if (!storedCode) {
      throw new BadRequestException({
        code: 'AUTH_CODE_EXPIRED',
        message: '验证码已过期',
      })
    }

    if (storedCode !== code) {
      // 增加尝试次数
      const newAttempts = await this.incrementCache(attemptKey, this.ATTEMPT_LOCK_SECONDS)

      throw new BadRequestException({
        code: 'AUTH_CODE_INVALID',
        message: `验证码错误，剩余${this.MAX_ATTEMPTS - newAttempts}次机会`,
      })
    }

    // 验证成功，删除验证码和尝试记录
    await this.deleteCache(codeKey)
    await this.deleteCache(attemptKey)

    // 查找或创建用户
    let user = await this.userRepository.findOne({
      where: { phone },
    })

    let isNewUser = false
    if (!user) {
      // 新用户自动注册
      user = this.userRepository.create({
        phone,
        status: UserStatus.ACTIVE,
      })
      await this.userRepository.save(user)
      isNewUser = true
      this.logger.log(`New user registered: ${phone}`)
    } else {
      // 更新登录时间
      user.lastLoginAt = new Date()
      await this.userRepository.save(user)
      this.logger.log(`User logged in: ${phone}`)
    }

    // 生成 JWT Token
    const token = await this.generateToken(user)
    const expiresIn = this.TOKEN_EXPIRY

    return {
      success: true,
      data: {
        user,
        token,
        expiresIn,
        isNewUser,
      },
    }
  }

  /**
   * 密码注册
   * 1. 验证验证码
   * 2. 检查用户是否已存在
   * 3. 验证邀请码（如果提供）
   * 4. 使用 bcrypt 加密密码
   * 5. 创建新用户
   * 6. 更新邀请码使用次数
   * 7. 根据邀请码分配群组
   * 8. 生成 JWT Token
   */
  async register(dto: RegisterDto): Promise<{
    success: boolean
    data: {
      user: UserResponse
      token: string
      expiresIn: number
      groupId: string | null
    }
  }> {
    const { phone, code, password, inviteCode } = dto

    // 验证验证码
    const codeKey = this.CODE_PREFIX + phone
    const storedCode = await this.getCache(codeKey)

    if (!storedCode) {
      throw new BadRequestException({
        code: 'AUTH_CODE_EXPIRED',
        message: '验证码已过期',
      })
    }

    if (storedCode !== code) {
      throw new BadRequestException({
        code: 'AUTH_CODE_INVALID',
        message: '验证码错误',
      })
    }

    // 验证成功，删除验证码
    await this.deleteCache(codeKey)

    // 检查用户是否已存在
    const existingUser = await this.userRepository.findOne({
      where: { phone },
    })

    if (existingUser) {
      throw new BadRequestException({
        code: 'AUTH_USER_EXISTS',
        message: '该手机号已注册',
      })
    }

    // 验证邀请码（如果提供）
    let validatedGroupId: string | null = null
    if (inviteCode) {
      const validation = await this.inviteCodeService.validate({ code: inviteCode })
      if (!validation.valid) {
        throw new BadRequestException({
          code: 'AUTH_INVITE_CODE_INVALID',
          message: validation.message,
        })
      }
      validatedGroupId = validation.groupId
      this.logger.log(`Invite code ${inviteCode} validated, groupId: ${validatedGroupId}`)
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, this.BCRYPT_SALT_ROUNDS)

    // 创建新用户
    const user = this.userRepository.create({
      phone,
      password: hashedPassword,
      status: UserStatus.ACTIVE,
    })
    await this.userRepository.save(user)

    this.logger.log(`New user registered with password: ${phone}`)

    // 更新邀请码使用次数
    if (inviteCode) {
      try {
        await this.inviteCodeService.use(inviteCode)
        this.logger.log(`Invite code ${inviteCode} usage count incremented`)
      } catch (error) {
        // 邀请码使用失败不影响注册，记录日志即可
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        this.logger.warn(`Failed to update invite code usage: ${errorMessage}`)
      }
    }

    // 根据邀请码分配群组
    if (validatedGroupId) {
      try {
        await this.roundTableService.addUserToGroup(user.id, validatedGroupId)
        this.logger.log(`User ${user.id} added to group ${validatedGroupId} via invite code`)
      } catch (error) {
        // 群组分配失败不影响注册，记录日志即可
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        this.logger.warn(`Failed to add user to group: ${errorMessage}`)
      }
    }

    // 生成 JWT Token
    const token = await this.generateToken(user)
    const expiresIn = this.TOKEN_EXPIRY

    return {
      success: true,
      data: {
        user: this.toUserResponse(user),
        token,
        expiresIn,
        groupId: validatedGroupId,
      },
    }
  }

  /**
   * 密码登录
   * 1. 检查尝试次数限制（防止暴力破解）
   * 2. 使用 QueryBuilder 查询用户并包含 password 字段
   * 3. 验证用户存在且有密码
   * 4. 使用 bcrypt.compare 验证密码
   * 5. 验证失败则增加尝试次数
   * 6. 验证成功则删除尝试记录、更新登录时间、生成Token
   */
  async loginWithPassword(dto: PasswordLoginDto): Promise<{
    success: boolean
    data: {
      user: UserResponse
      token: string
      expiresIn: number
    }
  }> {
    const { phone, password } = dto

    // 检查尝试次数限制
    const attemptKey = this.PASSWORD_ATTEMPT_PREFIX + phone
    const attempts = await this.getCache(attemptKey)
    if (attempts && parseInt(attempts) >= this.MAX_PASSWORD_ATTEMPTS) {
      const ttl = await this.getTtl(attemptKey)
      throw new BadRequestException({
        code: 'TOO_MANY_ATTEMPTS',
        message: `密码错误次数过多，请${ttl}秒后重试`,
      })
    }

    // 使用 QueryBuilder 查询用户并包含 password 字段
    const user = await this.userRepository
      .createQueryBuilder('user')
      .where('user.phone = :phone', { phone })
      .addSelect('user.password')
      .getOne()

    // 验证用户存在
    if (!user) {
      throw new BadRequestException({
        code: 'AUTH_USER_NOT_FOUND',
        message: '用户不存在',
      })
    }

    // 验证用户已设置密码
    if (!user.password) {
      throw new BadRequestException({
        code: 'AUTH_NO_PASSWORD',
        message: '该账号未设置密码，请使用验证码登录',
      })
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      // 增加尝试次数
      const newAttempts = await this.incrementCache(attemptKey, this.PASSWORD_LOCK_SECONDS)

      throw new BadRequestException({
        code: 'AUTH_PASSWORD_INVALID',
        message: `密码错误，剩余${this.MAX_PASSWORD_ATTEMPTS - newAttempts}次机会`,
      })
    }

    // 验证成功，删除尝试记录
    await this.deleteCache(attemptKey)

    // 更新登录时间
    user.lastLoginAt = new Date()
    await this.userRepository.save(user)

    this.logger.log(`User logged in with password: ${phone}`)

    // 生成 JWT Token
    const token = await this.generateToken(user)
    const expiresIn = this.TOKEN_EXPIRY

    return {
      success: true,
      data: {
        user: this.toUserResponse(user),
        token,
        expiresIn,
      },
    }
  }

  /**
   * 刷新 Token
   */
  async refreshToken(dto: RefreshTokenDto): Promise<{
    success: boolean
    data: {
      token: string
      expiresIn: number
    }
  }> {
    const { token } = dto

    // 检查是否在黑名单中
    const blacklisted = await this.getCache(this.BLACKLIST_PREFIX + token)
    if (blacklisted) {
      throw new UnauthorizedException({
        code: 'AUTH_TOKEN_INVALID',
        message: 'Token已失效',
      })
    }

    try {
      // 验证旧 Token
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      })

      // 查找用户
      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      })

      if (!user) {
        throw new UnauthorizedException({
          code: 'AUTH_UNAUTHORIZED',
          message: '用户不存在',
        })
      }

      // 生成新 Token
      const newToken = await this.generateToken(user)
      const expiresIn = this.TOKEN_EXPIRY

      return {
        success: true,
        data: {
          token: newToken,
          expiresIn,
        },
      }
    } catch {
      throw new UnauthorizedException({
        code: 'AUTH_TOKEN_EXPIRED',
        message: 'Token已过期',
      })
    }
  }

  /**
   * 获取当前用户
   */
  async getCurrentUser(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    })

    if (!user) {
      throw new UnauthorizedException({
        code: 'AUTH_UNAUTHORIZED',
        message: '用户不存在',
      })
    }

    return user
  }

  /**
   * 登出（将 Token 加入黑名单）
   */
  async logout(token: string): Promise<{ success: boolean }> {
    try {
      // 解析 Token 获取过期时间
      const payload = this.jwtService.decode(token) as Record<string, unknown>
      if (payload && typeof payload.exp === 'number') {
        const ttl = payload.exp - Math.floor(Date.now() / 1000)
        if (ttl > 0) {
          // 将 Token 加入黑名单，过期时间为 Token 剩余有效期
          await this.setCache(this.BLACKLIST_PREFIX + token, '1', ttl)
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      this.logger.error('Logout error:', errorMessage)
    }

    return { success: true }
  }

  /**
   * 生成 6 位数字验证码
   */
  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  /**
   * 生成 JWT Token
   */
  private async generateToken(user: User): Promise<string> {
    const payload = {
      sub: user.id,
      phone: user.phone,
    }

    return this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.TOKEN_EXPIRY,
    })
  }

  /**
   * 将 User 实体转换为不包含密码的响应对象
   */
  private toUserResponse(user: User): UserResponse {
    // 使用对象展开并显式排除 password 字段
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _password, ...rest } = user
    return rest
  }

  /**
   * 发送短信（Mock 实现）
   * TODO: 后续集成短信服务商（阿里云/腾讯云）
   */
  private async sendSms(phone: string, code: string, scene: string): Promise<void> {
    // Mock 实现：直接打印日志
    this.logger.log(`[MOCK SMS] Sending code ${code} to ${phone}, scene: ${scene}`)

    // TODO: 实际短信发送逻辑
    // const smsService = this.configService.get('SMS_SERVICE');
    // if (smsService === 'aliyun') {
    //   await this.aliyunSmsService.send(phone, code, scene);
    // } else if (smsService === 'tencent') {
    //   await this.tencentSmsService.send(phone, code, scene);
    // }
  }
}
