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
 * 知识来源类型枚举
 * 对应 API-CONTRACT.md KnowledgeSourceType
 */
export enum KnowledgeSourceType {
  SELF_EXPLORATION = 'self_exploration', // 自我探索（深绿）
  OTHERS_SHARING = 'others_sharing', // 他人分享（浅绿）
  ROUND_TABLE = 'round_table', // 圆桌讨论（特定色）
  STUDY_BUDDY = 'study_buddy', // 学习伙伴
  CASE_STUDY = 'case_study', // 案例实践
}

/**
 * 知识来源接口
 * 对应 API-CONTRACT.md KnowledgeSource
 */
export interface KnowledgeSource {
  type: KnowledgeSourceType
  description: string
  depth: number // 深度 1-3
  contributedAt: string // 贡献时间 ISO 8601
}

/**
 * 认知维度接口
 * 对应 API-CONTRACT.md CognitiveDimension
 */
export interface CognitiveDimension {
  name: string
  score: number // 分数 0-100
  knowledgeSource: KnowledgeSource[]
}

/**
 * 认知历史记录接口
 * 对应 API-CONTRACT.md CognitiveHistory
 */
export interface CognitiveHistory {
  date: string
  dimensions: CognitiveDimension[]
  triggeredBy: string
}

/**
 * 认知边界图实体
 * 对应 API-CONTRACT.md 1.4 CognitiveMap
 */
@Entity('cognitive_maps')
export class CognitiveMap {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Index()
  @Column({ type: 'uuid', name: 'user_id' })
  userId: string

  @Column({ type: 'jsonb' })
  dimensions: CognitiveDimension[]

  @Column({ type: 'jsonb', default: [] })
  history: CognitiveHistory[]

  @Column({ type: 'uuid', nullable: true, name: 'roundtable_id' })
  roundTableId: string

  @Column({ type: 'timestamptz', nullable: true, name: 'recorded_at' })
  recordedAt: Date

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date

  // 关联关系
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User
}
