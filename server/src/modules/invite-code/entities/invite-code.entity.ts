import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm'
import { User } from '../../user/entities/user.entity'
import { RoundTable } from '../../roundtable/entities/roundtable.entity'

/**
 * 邀请码状态枚举
 */
export enum InviteCodeStatus {
  ACTIVE = 'active', // 可用
  EXPIRED = 'expired', // 已过期
  DISABLED = 'disabled', // 已禁用
}

/**
 * 邀请码实体
 * 用于用户注册邀请和群组关联
 */
@Entity('invite_codes')
export class InviteCode {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 20 })
  code: string

  @Index()
  @Column({ type: 'uuid', nullable: true, name: 'group_id' })
  groupId: string | null

  @Index()
  @Column({ type: 'uuid', name: 'created_by' })
  createdBy: string

  @Column({ type: 'int', default: 10, name: 'max_uses' })
  maxUses: number

  @Column({ type: 'int', default: 0, name: 'used_count' })
  usedCount: number

  @Column({ type: 'timestamptz', nullable: true, name: 'expires_at' })
  expiresAt: Date | null

  @Index()
  @Column({
    type: 'enum',
    enum: InviteCodeStatus,
    default: InviteCodeStatus.ACTIVE,
  })
  status: InviteCodeStatus

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date

  // 关联关系
  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User

  @ManyToOne(() => RoundTable, { nullable: true })
  @JoinColumn({ name: 'group_id' })
  group: RoundTable | null
}
