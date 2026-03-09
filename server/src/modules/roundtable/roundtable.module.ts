import { Module, forwardRef } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { RoundTable, RoundTableParticipant, ChatMessage } from './entities'
import { RoundTableController } from './roundtable.controller'
import { RoundTableService } from './roundtable.service'
import { RoundTableGateway } from './gateway/roundtable.gateway'
import { User } from '../user/entities/user.entity'
import { UserProfile } from '../user/entities/user-profile.entity'
import { CognitiveModule } from '../cognitive'
import { CognitiveBoundaryModule } from '../cognitive-boundary'
import { AuthModule } from '../auth/auth.module'

/**
 * 圆桌模块
 * 提供圆桌匹配、讨论、纪要等功能
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([RoundTable, RoundTableParticipant, ChatMessage, User, UserProfile]),
    forwardRef(() => CognitiveModule),
    forwardRef(() => CognitiveBoundaryModule),
    AuthModule,
  ],
  controllers: [RoundTableController],
  providers: [RoundTableService, RoundTableGateway],
  exports: [RoundTableService, RoundTableGateway],
})
export class RoundTableModule {}
