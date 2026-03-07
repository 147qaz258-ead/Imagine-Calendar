import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { EventController } from './event.controller'
import { EventService } from './event.service'
import { Event } from './entities/event.entity'
import { UserEvent } from './entities/user-event.entity'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [TypeOrmModule.forFeature([Event, UserEvent]), AuthModule],
  controllers: [EventController],
  providers: [EventService],
  exports: [EventService],
})
export class EventModule {}
