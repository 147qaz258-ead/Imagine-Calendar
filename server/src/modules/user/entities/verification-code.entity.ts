import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm'

/**
 * 验证码实体
 * 用于手机验证码登录
 */
@Entity('verification_codes')
export class VerificationCode {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Index()
  @Column({ type: 'varchar', length: 11 })
  phone: string

  @Column({ type: 'varchar', length: 6 })
  code: string

  @Column({ type: 'timestamptz', name: 'expires_at' })
  expiresAt: Date

  @Column({ type: 'boolean', default: false })
  used: boolean

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date
}
