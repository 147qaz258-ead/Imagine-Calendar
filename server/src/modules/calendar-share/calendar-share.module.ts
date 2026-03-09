import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CalendarShare } from './entities/calendar-share.entity'
import { RoundTableParticipant } from '../roundtable/entities/roundtable-participant.entity'
import { RoundTable } from '../roundtable/entities/roundtable.entity'
import { Event } from '../event/entities/event.entity'
import { CalendarShareController } from './calendar-share.controller'
import { CalendarShareService } from './calendar-share.service'

/**
 * 日历共享模块
 * TASK-4.4: 日历共享功能
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([CalendarShare, RoundTableParticipant, RoundTable, Event]),
  ],
  controllers: [CalendarShareController],
  providers: [CalendarShareService],
  exports: [CalendarShareService],
})
export class CalendarShareModule {}