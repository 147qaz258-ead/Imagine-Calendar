import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

// 导入所有实体
import { User, UserProfile, School, Major, VerificationCode } from '../modules/user/entities';
import { Event, UserEvent } from '../modules/event/entities';
import { RoundTable, RoundTableParticipant, ChatMessage } from '../modules/roundtable/entities';
import { CognitiveMap } from '../modules/cognitive/entities';
import { Notification } from '../modules/notification/entities';

/**
 * 数据库模块
 * 配置 TypeORM 连接和实体注册
 * 支持本地开发和云部署（Supabase/Render）
 */
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const isProduction = configService.get('NODE_ENV') === 'production';
        const databaseUrl = configService.get('DATABASE_URL');

        // 如果提供了 DATABASE_URL（云部署），优先使用
        if (databaseUrl) {
          return {
            type: 'postgres',
            url: databaseUrl,
            ssl: isProduction ? { rejectUnauthorized: false } : false,
            entities: [
              User,
              UserProfile,
              School,
              Major,
              VerificationCode,
              Event,
              UserEvent,
              RoundTable,
              RoundTableParticipant,
              ChatMessage,
              CognitiveMap,
              Notification,
            ],
            synchronize: true,
            logging: !isProduction,
          };
        }

        // 否则使用分离的配置（本地开发）
        return {
          type: 'postgres',
          host: configService.get('DB_HOST'),
          port: configService.get('DB_PORT'),
          username: configService.get('DB_USERNAME'),
          password: configService.get('DB_PASSWORD'),
          database: configService.get('DB_DATABASE'),
          entities: [
            User,
            UserProfile,
            School,
            Major,
            VerificationCode,
            Event,
            UserEvent,
            RoundTable,
            RoundTableParticipant,
            ChatMessage,
            CognitiveMap,
            Notification,
          ],
          synchronize: true,
          logging: !isProduction,
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}