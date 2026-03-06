import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import { JwtAuthGuard } from './common/guards/jwt-auth.guard'
import { DatabaseModule } from './database/database.module'
import { AuthModule } from './modules/auth'
import { UserModule } from './modules/user/user.module'
import { EventModule } from './modules/event/event.module'
import { NotificationModule } from './modules/notification/notification.module'
import { RoundTableModule } from './modules/roundtable'
import { CognitiveModule } from './modules/cognitive'
import { FilterModule } from './modules/filter/filter.module'

// 配置验证
import * as Joi from 'joi'

@Module({
  imports: [
    // 环境变量配置
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
        PORT: Joi.number().default(3001),
        // 云部署使用 DATABASE_URL
        DATABASE_URL: Joi.string().optional(),
        // 本地开发使用分离配置
        DB_HOST: Joi.string().when('DATABASE_URL', {
          is: Joi.exist(),
          then: Joi.optional(),
          otherwise: Joi.required(),
        }),
        DB_PORT: Joi.number().default(5432),
        DB_USERNAME: Joi.string().when('DATABASE_URL', {
          is: Joi.exist(),
          then: Joi.optional(),
          otherwise: Joi.required(),
        }),
        DB_PASSWORD: Joi.string().when('DATABASE_URL', {
          is: Joi.exist(),
          then: Joi.optional(),
          otherwise: Joi.required(),
        }),
        DB_DATABASE: Joi.string().when('DATABASE_URL', {
          is: Joi.exist(),
          then: Joi.optional(),
          otherwise: Joi.required(),
        }),
        // Redis 支持 URL 或分离配置
        REDIS_URL: Joi.string().optional(),
        REDIS_HOST: Joi.string().when('REDIS_URL', {
          is: Joi.exist(),
          then: Joi.optional(),
          otherwise: Joi.default('localhost'),
        }),
        REDIS_PORT: Joi.number().default(6379),
        JWT_SECRET: Joi.string().required(),
        JWT_EXPIRES_IN: Joi.string().default('7d'),
      }),
    }),

    // 数据库模块
    DatabaseModule,

    // 业务模块
    AuthModule,
    UserModule,
    EventModule,
    NotificationModule,
    RoundTableModule,
    CognitiveModule,
    FilterModule,
  ],
  providers: [
    // 全局 JWT 认证守卫
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}