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
import { CognitiveDimension } from './cognitive-map.entity'

/**
 * 认知报告版本实体
 * 用于存储用户认知图谱的历史版本，支持版本对比功能
 */
@Entity('cognitive_versions')
export class CognitiveVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Index()
  @Column({ type: 'uuid', name: 'user_id' })
  userId: string

  @Column({ type: 'int', name: 'version_number' })
  versionNumber: number

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'version_name' })
  versionName: string | null

  @Column({ type: 'text', nullable: true })
  description: string | null

  @Column({ type: 'jsonb' })
  dimensions: CognitiveDimension[]

  @Column({ type: 'uuid', nullable: true, name: 'roundtable_id' })
  roundTableId: string | null

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'trigger_type' })
  triggerType: string | null

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date

  // 关联关系
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User
}