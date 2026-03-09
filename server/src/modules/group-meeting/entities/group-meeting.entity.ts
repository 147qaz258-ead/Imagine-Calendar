import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm'
import { RoundTable } from '../../roundtable/entities/roundtable.entity'
import { User } from '../../user/entities/user.entity'

/**
 * 会议状态枚举
 */
export enum MeetingStatus {
  SCHEDULED = 'scheduled', // 已安排
  COMPLETED = 'completed', // 已完成
  CANCELLED = 'cancelled', // 已取消
}

/**
 * 群组会议实体
 * TASK-4.5: 发起会议功能
 */
@Entity('group_meetings')
export class GroupMeeting {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Index()
  @Column({ type: 'uuid', name: 'group_id' })
  groupId: string

  @Column({ type: 'varchar', length: 100 })
  title: string

  @Index()
  @Column({ type: 'timestamptz', name: 'scheduled_at' })
  scheduledAt: Date

  @Column({ type: 'int', default: 120 })
  duration: number // 时长（分钟）

  @Column({ type: 'varchar', length: 500, name: 'meeting_url', nullable: true })
  meetingUrl: string | null

  @Column({ type: 'varchar', length: 200, nullable: true })
  location: string | null

  @Column({ type: 'text', nullable: true })
  notes: string | null

  @Column({
    type: 'enum',
    enum: MeetingStatus,
    default: MeetingStatus.SCHEDULED,
  })
  status: MeetingStatus

  @Column({ type: 'uuid', name: 'created_by' })
  createdBy: string

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date

  // 关联关系
  @ManyToOne(() => RoundTable)
  @JoinColumn({ name: 'group_id' })
  group: RoundTable

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User
}