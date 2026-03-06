import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { RoundTable, RoundTableStatus } from './roundtable.entity';

/**
 * 参与者角色枚举
 * 对应 API-CONTRACT.md ParticipantRole
 */
export enum ParticipantRole {
  HOST = 'host',       // 主持人
  MEMBER = 'member',   // 普通成员
}

/**
 * 参与者状态
 */
export enum ParticipantStatus {
  APPLIED = 'applied',     // 已报名
  MATCHED = 'matched',     // 已匹配
  JOINED = 'joined',       // 已加入
  LEFT = 'left',           // 已离开
  CANCELLED = 'cancelled', // 已取消
}

/**
 * 圆桌参与者实体
 */
@Entity('roundtable_participants')
export class RoundTableParticipant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid', name: 'roundtable_id' })
  roundTableId: string;

  @Index()
  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({
    type: 'enum',
    enum: ParticipantRole,
    default: ParticipantRole.MEMBER,
  })
  role: ParticipantRole;

  @Column({
    type: 'enum',
    enum: ParticipantStatus,
    default: ParticipantStatus.APPLIED,
  })
  status: ParticipantStatus;

  @Column({ type: 'jsonb', default: {} })
  preferences: Record<string, any>;

  @Column({ type: 'timestamptz', nullable: true, name: 'matched_at' })
  matchedAt: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'joined_at' })
  joinedAt: Date;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  // 关联关系
  @ManyToOne(() => RoundTable, (roundTable) => roundTable.participants)
  @JoinColumn({ name: 'roundtable_id' })
  roundTable: RoundTable;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}