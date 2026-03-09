import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm'
import { User } from '../../user/entities/user.entity'
import { RoundTable } from '../../roundtable/entities/roundtable.entity'

/**
 * 日历共享状态枚举
 */
export enum CalendarShareStatus {
  PENDING = 'pending',     // 待接受
  ACCEPTED = 'accepted',   // 已接受
  DECLINED = 'declined',   // 已拒绝
}

/**
 * 日历共享实体
 * TASK-4.4: 日历共享功能
 * 组长发起点历共享邀请，成员接受后组长可查看空闲时间
 */
@Entity('calendar_shares')
export class CalendarShare {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Index()
  @Column({ type: 'uuid', name: 'user_id' })
  userId: string

  @Index()
  @Column({ type: 'uuid', name: 'viewer_id' })
  viewerId: string

  @Index()
  @Column({ type: 'uuid', name: 'group_id' })
  groupId: string

  @Column({
    type: 'enum',
    enum: CalendarShareStatus,
    default: CalendarShareStatus.PENDING,
  })
  status: CalendarShareStatus

  @Column({ type: 'timestamptz', name: 'shared_at', nullable: true })
  sharedAt: Date | null

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date

  // 关联关系
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User

  @ManyToOne(() => User)
  @JoinColumn({ name: 'viewer_id' })
  viewer: User

  @ManyToOne(() => RoundTable)
  @JoinColumn({ name: 'group_id' })
  group: RoundTable
}