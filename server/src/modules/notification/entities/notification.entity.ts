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

/**
 * 通知类型枚举
 * 对应 API-CONTRACT.md NotificationType
 */
export enum NotificationType {
  EVENT_REMINDER = 'event_reminder', // 活动提醒
  ROUND_TABLE_INVITE = 'round_table_invite', // 圆桌邀请
  ROUND_TABLE_START = 'round_table_start', // 圆桌开始
  SYSTEM = 'system', // 系统消息
}

/**
 * 通知实体
 * 对应 API-CONTRACT.md 1.5 Notification
 */
@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Index()
  @Column({ type: 'uuid', name: 'user_id' })
  userId: string

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType

  @Column({ type: 'varchar', length: 200 })
  title: string

  @Column({ type: 'text' })
  content: string

  @Column({ type: 'jsonb', nullable: true })
  data: Record<string, any>

  @Column({ type: 'boolean', default: false, name: 'is_read' })
  read: boolean

  @Column({ type: 'timestamptz', nullable: true, name: 'read_at' })
  readAt: Date

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date

  // 关联关系
  @ManyToOne(() => User, (user) => user.notifications)
  @JoinColumn({ name: 'user_id' })
  user: User
}
