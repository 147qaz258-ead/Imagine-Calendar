import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm'

/**
 * 专业实体
 * 基础数据表，存储专业分类列表
 */
@Entity('majors')
export class Major {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Index()
  @Column({ type: 'varchar', length: 100 })
  name: string

  @Column({ type: 'varchar', length: 50, nullable: true })
  category: string

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date
}
