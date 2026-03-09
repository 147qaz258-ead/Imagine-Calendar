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

/**
 * 评估阶段类型
 */
export type AssessmentStage = 'initial' | 'after_roundtable'

/**
 * 子类别统计信息
 */
export interface SubCategoryStats {
  subCategory: string
  subCategoryName: string
  questionCount: number
  averageScore: number
}

/**
 * 问题评估记录接口
 */
export interface QuestionAssessmentData {
  questionId: string
  level: number // 1-5
  assessedAt: string
  /** 子类别标识，如 "Beijing"、"Internet" 等 */
  subCategory?: string
  /** 用户对该问题的备注 */
  notes?: string
  /** 评估阶段：初始评估 or 圆桌后重评 */
  stage?: AssessmentStage
}

/**
 * 维度评估数据接口
 */
export interface DimensionAssessmentData {
  dimensionKey: string
  dimensionName: string
  assessments: QuestionAssessmentData[]
  averageScore: number
  /** 该维度下的子类别统计 */
  subCategories?: SubCategoryStats[]
}

/**
 * 认知边界评估实体
 * 存储用户的认知边界评估结果
 */
@Entity('cognitive_boundary_assessments')
export class CognitiveBoundaryAssessment {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Index()
  @Column({ type: 'uuid', name: 'user_id' })
  userId: string

  @Column({ type: 'jsonb', default: [] })
  dimensions: DimensionAssessmentData[]

  @Column({ type: 'int', name: 'total_questions', default: 0 })
  totalQuestions: number

  @Column({ type: 'int', name: 'assessed_questions', default: 0 })
  assessedQuestions: number

  @Column({ type: 'timestamptz', name: 'completed_at', nullable: true })
  completedAt: Date | null

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date

  // 关联关系
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User
}