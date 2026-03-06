import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../user/entities/user.entity';

/**
 * JWT 载荷接口
 */
export interface JwtPayload {
  sub: string; // 用户 ID
  phone: string; // 手机号
  iat?: number; // 签发时间
  exp?: number; // 过期时间
}

/**
 * JWT 策略
 * 用于 Passport JWT 认证
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  /**
   * 验证 JWT 载荷
   * 返回的用户信息将被附加到 request.user
   */
  async validate(payload: JwtPayload): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException({
        code: 'AUTH_UNAUTHORIZED',
        message: '用户不存在',
      });
    }

    // 返回用户信息（将附加到 request.user）
    return {
      sub: user.id,
      phone: user.phone,
      status: user.status,
    };
  }
}