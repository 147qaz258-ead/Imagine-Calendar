import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
  Index,
} from 'typeorm'
import { User } from '../../user/entities/user.entity'

/**
 * 企业类型枚举（颜色编码）
 * 对应 API-CONTRACT.md CompanyType
 */
export enum CompanyType {
  SOE = 'soe', // 国企（灰色）
  FOREIGN = 'foreign', // 外企（紫色）
  PRIVATE = 'private', // 民企（黄色）
  STARTUP = 'startup', // 创业公司（橙色）
  GOVERNMENT = 'government', // 事业单位（蓝色）
}

/**
 * 招聘事件实体
 * 对应 API-CONTRACT.md 1.2 Event
 */
@Entity('events')
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'varchar', length: 200 })
  title: string

  @Column({ type: 'varchar', length: 200, name: 'company_name' })
  company: string

  @Column({
    type: 'enum',
    enum: CompanyType,
    name: 'company_type',
    nullable: true,
  })
  companyType: CompanyType

  @Column({ type: 'varchar', length: 200, nullable: true })
  position: string

  @Column({ type: 'text', nullable: true })
  description: string

  @Column({ type: 'varchar', length: 500, nullable: true })
  location: string

  @Index()
  @Column({ type: 'date', name: 'event_date' })
  eventDate: string

  @Column({ type: 'varchar', length: 5, nullable: true, name: 'start_time' })
  startTime: string

  @Column({ type: 'varchar', length: 5, nullable: true, name: 'end_time' })
  endTime: string

  @Column({ type: 'timestamptz', nullable: true })
  deadline: Date

  @Column({
    type: 'text',
    nullable: true,
    name: 'requirements',
    transformer: {
      to: (value: string[]) => (value ? JSON.stringify(value) : null),
      from: (value: string) => (value ? JSON.parse(value) : null),
    },
  })
  requirements: string[]

  @Column({
    type: 'text',
    nullable: true,
    name: 'benefits',
    transformer: {
      to: (value: string[]) => (value ? JSON.stringify(value) : null),
      from: (value: string) => (value ? JSON.parse(value) : null),
    },
  })
  benefits: string[]

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'apply_url' })
  applyUrl: string

  @Column({ type: 'simple-array', nullable: true })
  tags: string[]

  @Column({ type: 'varchar', length: 200, nullable: true })
  source: string

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: string

  @Column({ type: 'uuid', nullable: true, name: 'related_id' })
  relatedId: string

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date

  // 关注用户关系通过 UserEvent 实体维护
}
