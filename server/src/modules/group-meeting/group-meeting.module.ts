import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { GroupMeeting } from './entities/group-meeting.entity'
import { RoundTableParticipant } from '../roundtable/entities/roundtable-participant.entity'
import { RoundTable } from '../roundtable/entities/roundtable.entity'
import { Event } from '../event/entities/event.entity'
import { UserEvent } from '../event/entities/user-event.entity'
import { User } from '../user/entities/user.entity'
import { GroupMeetingController } from './group-meeting.controller'
import { GroupMeetingService } from './group-meeting.service'
import { NotificationModule } from '../notification/notification.module'

/**
 * 群组会议模块
 * TASK-4.5: 发起会议功能
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([GroupMeeting, RoundTableParticipant, RoundTable, Event, UserEvent, User]),
    NotificationModule,
  ],
  controllers: [GroupMeetingController],
  providers: [GroupMeetingService],
  exports: [GroupMeetingService],
})
export class GroupMeetingModule {}