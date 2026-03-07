import {
  DataSource,
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm'
import * as bcrypt from 'bcryptjs'
import { config } from 'dotenv'
import { resolve } from 'path'

// 加载环境变量
config({ path: resolve(__dirname, '../.env') })

/**
 * 用户状态枚举
 */
enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BANNED = 'banned',
}

/**
 * 用户实体（简化版，仅用于 seed）
 */
@Entity('users')
class User {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'varchar', length: 11, unique: true })
  phone: string

  @Column({ type: 'varchar', length: 50, nullable: true })
  nickname: string

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'avatar_url' })
  avatar: string

  @Column({ type: 'varchar', length: 255, nullable: true, select: false })
  password: string

  @Column({ type: 'varchar', length: 100, nullable: true })
  school: string

  @Column({ type: 'varchar', length: 100, nullable: true })
  major: string

  @Column({ type: 'varchar', length: 20, nullable: true })
  grade: string

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'student_id' })
  studentId: string

  @Column({ type: 'int', nullable: true, name: 'graduation_year' })
  graduationYear: number

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus

  @Column({ type: 'timestamptz', nullable: true, name: 'last_login_at' })
  lastLoginAt: Date

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date
}

/**
 * 用户画像实体（简化版，仅用于 seed）
 */
@Entity('user_profiles')
class UserProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string

  @Column({ type: 'uuid', nullable: true, name: 'school_id' })
  schoolId: string

  @Column({ type: 'uuid', nullable: true, name: 'major_id' })
  majorId: string

  @Column({ type: 'varchar', length: 20, nullable: true })
  grade: string

  @Column({ type: 'int', nullable: true, name: 'graduation_year' })
  graduationYear: number

  @Column({ type: 'varchar', length: 50, nullable: true })
  city: string

  @Column({ type: 'varchar', length: 50, nullable: true })
  name: string

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'student_id' })
  studentId: string

  @Column({ type: 'jsonb', default: {} })
  preferences: Record<string, string[]>

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date
}

/**
 * 默认用户偏好（用于圆桌匹配）
 */
const DEFAULT_PREFERENCES: Record<string, string[]> = {
  locations: ['北京', '上海', '深圳'],
  selfPositioning: ['技术型'],
  developmentDirection: ['技术专家'],
  industries: ['互联网', '科技'],
  platformTypes: ['大厂', '独角兽'],
  companyScales: ['大型企业'],
  companyCulture: ['创新', '扁平'],
  leadershipStyle: ['授权型'],
  trainingPrograms: ['技术培训', '导师制'],
  overtimePreference: ['弹性'],
  holidayPolicy: ['双休'],
  medicalBenefits: ['商业保险'],
  maternityBenefits: ['产假', '育儿假'],
}

/**
 * 内测账号配置
 */
const TEST_ACCOUNTS = [
  {
    phone: '13800000001',
    password: 'Test123456',
    nickname: '测试用户1',
    school: '清华大学',
    major: '计算机科学与技术',
    grade: '2023级',
  },
  {
    phone: '13800000002',
    password: 'Test123456',
    nickname: '测试用户2',
    school: '北京大学',
    major: '软件工程',
    grade: '2023级',
  },
  {
    phone: '13800000003',
    password: 'Test123456',
    nickname: '测试用户3',
    school: '浙江大学',
    major: '人工智能',
    grade: '2023级',
  },
  {
    phone: '13800000004',
    password: 'Test123456',
    nickname: '测试用户4',
    school: '上海交通大学',
    major: '数据科学',
    grade: '2023级',
  },
  {
    phone: '13800000005',
    password: 'Test123456',
    nickname: '测试用户5',
    school: '复旦大学',
    major: '信息安全',
    grade: '2023级',
  },
]

async function seed() {
  console.log('Starting database seed...')

  // 获取数据库 URL
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    console.error('DATABASE_URL is not set!')
    process.exit(1)
  }

  // 创建数据源
  const dataSource = new DataSource({
    type: 'postgres',
    url: databaseUrl,
    ssl: { rejectUnauthorized: false },
    entities: [User, UserProfile],
    synchronize: true, // 自动创建表
    logging: true,
  })

  try {
    await dataSource.initialize()
    console.log('Database connected')

    const userRepository = dataSource.getRepository(User)
    const profileRepository = dataSource.getRepository(UserProfile)
    const saltRounds = 10

    for (const account of TEST_ACCOUNTS) {
      // 检查用户是否已存在
      let user = await userRepository.findOne({
        where: { phone: account.phone },
      })

      if (user) {
        console.log(`User ${account.phone} already exists, checking profile...`)

        // 确保 profile 存在
        let profile = await profileRepository.findOne({
          where: { userId: user.id },
        })

        if (!profile) {
          // 创建 profile
          profile = profileRepository.create({
            userId: user.id,
            grade: account.grade,
            preferences: DEFAULT_PREFERENCES,
          })
          await profileRepository.save(profile)
          console.log(`Created profile for user: ${account.nickname}`)
        } else {
          console.log(`Profile already exists for user: ${account.nickname}`)
        }
        continue
      }

      // 加密密码
      const hashedPassword = await bcrypt.hash(account.password, saltRounds)

      // 创建用户
      user = userRepository.create({
        phone: account.phone,
        password: hashedPassword,
        nickname: account.nickname,
        school: account.school,
        major: account.major,
        grade: account.grade,
        status: UserStatus.ACTIVE,
      })

      await userRepository.save(user)
      console.log(`Created user: ${account.nickname} (${account.phone})`)

      // 创建用户画像
      const profile = profileRepository.create({
        userId: user.id,
        grade: account.grade,
        preferences: DEFAULT_PREFERENCES,
      })
      await profileRepository.save(profile)
      console.log(`Created profile for user: ${account.nickname}`)
    }

    console.log('\n========================================')
    console.log('Seed completed! Test accounts:')
    console.log('========================================')
    console.log('手机号\t\t密码\t\t昵称')
    console.log('----------------------------------------')
    for (const account of TEST_ACCOUNTS) {
      console.log(`${account.phone}\t${account.password}\t${account.nickname}`)
    }
    console.log('========================================')
  } catch (error) {
    console.error('Seed failed:', error)
    process.exit(1)
  } finally {
    await dataSource.destroy()
  }
}

seed()
