import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

/**
 * 用户偏好（13维度）
 * 对应 API-CONTRACT.md UserPreferences
 */
export interface UserPreferences {
  locations: string[];           // 地点偏好
  selfPositioning: string[];     // 自我定位
  developmentDirection: string[];// 发展方向
  industries: string[];          // 行业偏好
  platformTypes: string[];       // 平台性质
  companyScales: string[];       // 企业规模
  companyCulture: string[];      // 企业文化
  leadershipStyle: string[];     // 领导风格
  trainingPrograms: string[];    // 培训项目
  overtimePreference: string[];  // 加班偏好
  holidayPolicy: string[];       // 假期偏好
  medicalBenefits: string[];     // 医疗保障
  maternityBenefits: string[];   // 生育福利
}

/**
 * 用户画像实体
 * 存储13维度偏好设置
 */
@Entity('user_profiles')
export class UserProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'uuid', nullable: true, name: 'school_id' })
  schoolId: string;

  @Column({ type: 'uuid', nullable: true, name: 'major_id' })
  majorId: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  grade: string;

  @Column({ type: 'int', nullable: true, name: 'graduation_year' })
  graduationYear: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  city: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  name: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'student_id' })
  studentId: string;

  @Column({
    type: 'jsonb',
    default: {},
  })
  preferences: UserPreferences;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  // 关联关系
  @OneToOne(() => User, (user) => user.profile)
  @JoinColumn({ name: 'user_id' })
  user: User;
}