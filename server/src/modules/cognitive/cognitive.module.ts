import { Module, forwardRef } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CognitiveMap, CognitiveVersion } from './entities'
import { User } from '../user/entities/user.entity'
import { CognitiveController } from './cognitive.controller'
import { CognitiveService } from './cognitive.service'
import { AuthModule } from '../auth/auth.module'

/**
 * 认知图谱模块
 * 提供认知维度记录、历史查询、版本管理、对比分析等功能
 * 对应 API-CONTRACT.md 第 7 章
 */
@Module({
  imports: [TypeOrmModule.forFeature([CognitiveMap, CognitiveVersion, User]), forwardRef(() => AuthModule)],
  controllers: [CognitiveController],
  providers: [CognitiveService],
  exports: [CognitiveService],
})
export class CognitiveModule {}