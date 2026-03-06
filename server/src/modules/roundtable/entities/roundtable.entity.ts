import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { RoundTableParticipant } from './roundtable-participant.entity';
import { ChatMessage } from './chat-message.entity';

/**
 * 圆桌状态枚举
 * 对应 API-CONTRACT.md RoundTableStatus
 */
export enum RoundTableStatus {
  MATCHING = 'matching',         // 匹配中
  READY = 'ready',               // 人齐待开始
  IN_PROGRESS = 'in_progress',   // 进行中
  COMPLETED = 'completed',       // 已完成
  CANCELLED = 'cancelled',       // 已取消
}

/**
 * 圆桌讨论实体
 * 对应 API-CONTRACT.md 1.3 RoundTable
 */
@Entity('roundtables')
export class RoundTable {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  topic: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Index()
  @Column({ type: 'timestamptz', nullable: true })
  scheduledAt: Date;

  @Column({ type: 'int', default: 120, name: 'duration_minutes' })
  duration: number;

  @Column({ type: 'int', default: 6, name: 'max_participants' })
  maxParticipants: number;

  @Index()
  @Column({
    type: 'enum',
    enum: RoundTableStatus,
    default: RoundTableStatus.MATCHING,
  })
  status: RoundTableStatus;

  @Column({ type: 'simple-array', nullable: true })
  questions: string[];

  @Column({ type: 'text', nullable: true })
  summary: string;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  // 关联关系
  @OneToMany(() => RoundTableParticipant, (participant) => participant.roundTable)
  participants: RoundTableParticipant[];

  @OneToMany(() => ChatMessage, (message) => message.roundTable)
  messages: ChatMessage[];
}