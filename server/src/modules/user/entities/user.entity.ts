import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  Index,
} from 'typeorm';
import { UserProfile } from './user-profile.entity';
import { Notification } from '../../notification/entities/notification.entity';

/**
 * 用户状态枚举
 */
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BANNED = 'banned',
}

/**
 * 用户实体
 * 对应 API-CONTRACT.md 1.1 User
 */
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 11, unique: true })
  phone: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  nickname: string;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'avatar_url' })
  avatar: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  school: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  major: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  grade: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'student_id' })
  studentId: string;

  @Column({ type: 'int', nullable: true, name: 'graduation_year' })
  graduationYear: number;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @Column({ type: 'timestamptz', nullable: true, name: 'last_login_at' })
  lastLoginAt: Date;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  // 关联关系
  @OneToOne(() => UserProfile, (profile) => profile.user, { cascade: true })
  profile: UserProfile;

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];
}