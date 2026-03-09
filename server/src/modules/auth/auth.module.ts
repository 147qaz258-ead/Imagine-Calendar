import { Module, forwardRef } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { JwtStrategy } from './strategies'
import { User, VerificationCode } from '../user/entities'
import { InviteCodeModule } from '../invite-code/invite-code.module'
import { RoundTableModule } from '../roundtable/roundtable.module'

/**
 * 认证模块
 * 提供用户认证相关功能
 */
@Module({
  imports: [
    // Passport 模块
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // JWT 模块（异步配置）
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '7d'),
        },
      }),
      inject: [ConfigService],
    }),

    // 数据库实体
    TypeOrmModule.forFeature([User, VerificationCode]),

    // 邀请码模块
    InviteCodeModule,

    // 圆桌模块（用于邀请码关联群组）
    forwardRef(() => RoundTableModule),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
