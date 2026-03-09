import { Module, forwardRef } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CognitiveBoundaryAssessment } from './entities/cognitive-boundary-assessment.entity'
import { User } from '../user/entities/user.entity'
import { CognitiveBoundaryController } from './cognitive-boundary.controller'
import { CognitiveBoundaryService } from './cognitive-boundary.service'
import { AuthModule } from '../auth/auth.module'

/**
 * 摸索认知边界模块
 * 提供问题评估的存储和查询功能
 */
@Module({
  imports: [TypeOrmModule.forFeature([CognitiveBoundaryAssessment, User]), forwardRef(() => AuthModule)],
  controllers: [CognitiveBoundaryController],
  providers: [CognitiveBoundaryService],
  exports: [CognitiveBoundaryService],
})
export class CognitiveBoundaryModule {}