import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm'

/**
 * 学校实体
 * 基础数据表，存储全国高校列表
 */
@Entity('schools')
export class School {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Index()
  @Column({ type: 'varchar', length: 100, unique: true })
  name: string

  @Column({ type: 'varchar', length: 50, nullable: true })
  province: string

  @Column({ type: 'varchar', length: 50, nullable: true })
  city: string

  @Column({ type: 'varchar', length: 20, nullable: true })
  level: string

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date
}
