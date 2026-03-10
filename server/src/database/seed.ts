import {
  DataSource,
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm'
import * as bcrypt from 'bcryptjs'
import { config } from 'dotenv'
import { join } from 'path'

// 加载环境变量 - 从 server 目录加载 .env 文件
config({ path: join(__dirname, '../../.env') })

/**
 * 用户状态枚举
 */
enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BANNED = 'banned',
}

/**
 * 圆桌状态枚举
 */
enum RoundTableStatus {
  MATCHING = 'matching',
  READY = 'ready',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

/**
 * 邀请码状态枚举
 */
enum InviteCodeStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  DISABLED = 'disabled',
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
 * 圆桌实体（简化版，仅用于 seed）
 */
@Entity('roundtables')
class RoundTable {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ type: 'varchar', length: 200, nullable: true })
  topic: string

  @Column({ type: 'text', nullable: true })
  description: string

  @Column({ type: 'timestamptz', nullable: true })
  scheduledAt: Date

  @Column({ type: 'int', default: 120, name: 'duration_minutes' })
  duration: number

  @Column({ type: 'int', default: 6, name: 'max_participants' })
  maxParticipants: number

  @Column({
    type: 'enum',
    enum: RoundTableStatus,
    default: RoundTableStatus.MATCHING,
  })
  status: RoundTableStatus

  @Column({ type: 'text', array: true, nullable: true })
  questions: string[]

  @Column({ type: 'text', nullable: true })
  summary: string

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date
}

/**
 * 邀请码实体（简化版，仅用于 seed）
 */
@Entity('invite_codes')
class InviteCode {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 20 })
  code: string

  @Index()
  @Column({ type: 'uuid', nullable: true, name: 'group_id' })
  groupId: string | null

  @Index()
  @Column({ type: 'uuid', name: 'created_by' })
  createdBy: string

  @Column({ type: 'int', default: 10, name: 'max_uses' })
  maxUses: number

  @Column({ type: 'int', default: 0, name: 'used_count' })
  usedCount: number

  @Column({ type: 'timestamptz', nullable: true, name: 'expires_at' })
  expiresAt: Date | null

  @Index()
  @Column({
    type: 'enum',
    enum: InviteCodeStatus,
    default: InviteCodeStatus.ACTIVE,
  })
  status: InviteCodeStatus

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
 * 系统管理员账号（用于创建邀请码）
 */
const SYSTEM_ADMIN = {
  phone: '10000000000',
  password: 'Admin@123',
  nickname: '系统管理员',
}

/**
 * 测试群组配置
 * 每个群组对应一个圆桌讨论主题
 */
const TEST_GROUPS = [
  {
    topic: '自我探索组',
    description: '探索职业兴趣边界，发现自己真正想做的事情',
    status: RoundTableStatus.MATCHING,
  },
  {
    topic: '职业发展组',
    description: '讨论职业发展规划，分享行业见解和经验',
    status: RoundTableStatus.MATCHING,
  },
  {
    topic: '行业交流组',
    description: '跨行业交流，了解不同行业的工作状态和发展前景',
    status: RoundTableStatus.MATCHING,
  },
]

/**
 * 生成邀请码配置
 * 每个群组生成6个邀请码
 * 格式: GROUP{组号}-{序号}，如 GROUP1-001, GROUP1-002 ...
 */
const generateInviteCodes = (
  groupId: string,
  groupIndex: number,
  createdBy: string,
): Array<{
  code: string
  groupId: string
  createdBy: string
  maxUses: number
}> => {
  const codes: Array<{
    code: string
    groupId: string
    createdBy: string
    maxUses: number
  }> = []
  for (let i = 1; i <= 6; i++) {
    codes.push({
      code: `GROUP${groupIndex}-${String(i).padStart(3, '0')}`,
      groupId,
      createdBy,
      maxUses: 1, // 每个邀请码只能使用1次，确保每组正好6人
    })
  }
  return codes
}

async function seed() {
  console.log('Starting database seed...')
  console.log('========================================')

  // 获取数据库配置
  const databaseUrl = process.env.DATABASE_URL
  const dbHost = process.env.DB_HOST
  const dbPort = process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432
  const dbUsername = process.env.DB_USERNAME
  const dbPassword = process.env.DB_PASSWORD
  const dbDatabase = process.env.DB_DATABASE

  // 优先使用 DATABASE_URL（云部署），否则使用分离配置（本地开发）
  const useDatabaseUrl = !!databaseUrl

  if (!useDatabaseUrl && !dbHost) {
    console.error('Neither DATABASE_URL nor DB_HOST is set!')
    console.error('Please configure database connection in .env file')
    process.exit(1)
  }

  // 创建数据源
  const dataSourceOptions = useDatabaseUrl
    ? {
        type: 'postgres' as const,
        url: databaseUrl,
        ssl: { rejectUnauthorized: false },
      }
    : {
        type: 'postgres' as const,
        host: dbHost,
        port: dbPort,
        username: dbUsername,
        password: dbPassword,
        database: dbDatabase,
      }

  const dataSource = new DataSource({
    ...dataSourceOptions,
    entities: [User, UserProfile, RoundTable, InviteCode],
    synchronize: true, // 自动创建表
    logging: true,
  })

  try {
    await dataSource.initialize()
    console.log('Database connected')

    const userRepository = dataSource.getRepository(User)
    const profileRepository = dataSource.getRepository(UserProfile)
    const roundTableRepository = dataSource.getRepository(RoundTable)
    const inviteCodeRepository = dataSource.getRepository(InviteCode)
    const saltRounds = 10

    // ========================================
    // Step 1: 创建系统管理员
    // ========================================
    console.log('\n[Step 1] Creating system admin...')

    let adminUser = await userRepository.findOne({
      where: { phone: SYSTEM_ADMIN.phone },
    })

    if (!adminUser) {
      const hashedPassword = await bcrypt.hash(SYSTEM_ADMIN.password, saltRounds)
      adminUser = userRepository.create({
        phone: SYSTEM_ADMIN.phone,
        password: hashedPassword,
        nickname: SYSTEM_ADMIN.nickname,
        status: UserStatus.ACTIVE,
      })
      await userRepository.save(adminUser)
      console.log(`Created admin user: ${SYSTEM_ADMIN.nickname}`)
    } else {
      console.log(`Admin user already exists: ${SYSTEM_ADMIN.nickname}`)
    }

    // ========================================
    // Step 2: 创建测试群组（圆桌）
    // ========================================
    console.log('\n[Step 2] Creating test groups (roundtables)...')

    const createdGroups: RoundTable[] = []

    for (let i = 0; i < TEST_GROUPS.length; i++) {
      const groupConfig = TEST_GROUPS[i]

      // 检查群组是否已存在
      let group = await roundTableRepository.findOne({
        where: { topic: groupConfig.topic },
      })

      if (!group) {
        group = roundTableRepository.create({
          topic: groupConfig.topic,
          description: groupConfig.description,
          status: groupConfig.status,
          maxParticipants: 6,
          duration: 120,
        })
        await roundTableRepository.save(group)
        console.log(`Created group ${i + 1}: ${groupConfig.topic}`)
      } else {
        console.log(`Group already exists: ${groupConfig.topic}`)
      }

      createdGroups.push(group)
    }

    // ========================================
    // Step 3: 创建邀请码
    // ========================================
    console.log('\n[Step 3] Creating invite codes...')

    const allInviteCodes: Array<{
      groupIndex: number
      code: string
      groupId: string
    }> = []

    for (let i = 0; i < createdGroups.length; i++) {
      const group = createdGroups[i]
      const codesConfig = generateInviteCodes(group.id, i + 1, adminUser.id)

      for (const codeConfig of codesConfig) {
        // 检查邀请码是否已存在
        let existingCode = await inviteCodeRepository.findOne({
          where: { code: codeConfig.code },
        })

        if (!existingCode) {
          const inviteCode = inviteCodeRepository.create({
            code: codeConfig.code,
            groupId: codeConfig.groupId,
            createdBy: codeConfig.createdBy,
            maxUses: codeConfig.maxUses,
            status: InviteCodeStatus.ACTIVE,
          })
          await inviteCodeRepository.save(inviteCode)
          console.log(`Created invite code: ${codeConfig.code} -> Group ${i + 1}`)
        } else {
          // 重置已存在的邀请码状态
          existingCode.status = InviteCodeStatus.ACTIVE
          existingCode.usedCount = 0
          existingCode.groupId = codeConfig.groupId
          existingCode.maxUses = codeConfig.maxUses
          await inviteCodeRepository.save(existingCode)
          console.log(`Reset invite code: ${codeConfig.code} -> Group ${i + 1}`)
        }

        allInviteCodes.push({
          groupIndex: i + 1,
          code: codeConfig.code,
          groupId: group.id,
        })
      }
    }

    // ========================================
    // 输出汇总信息
    // ========================================
    console.log('\n========================================')
    console.log('Seed completed successfully!')
    console.log('========================================')

    console.log('\n【系统管理员账号】')
    console.log('手机号\t\t密码\t\t昵称')
    console.log('----------------------------------------')
    console.log(
      `${SYSTEM_ADMIN.phone}\t${SYSTEM_ADMIN.password}\t${SYSTEM_ADMIN.nickname}`,
    )

    console.log('\n【测试群组】')
    console.log('序号\t群组名称\t\t描述')
    console.log('----------------------------------------')
    for (let i = 0; i < createdGroups.length; i++) {
      const group = createdGroups[i]
      console.log(`${i + 1}\t${group.topic}\t\t${group.description}`)
    }

    console.log('\n【邀请码清单】（可发给蒙蒙分发给测试学生）')
    console.log('群组\t\t邀请码\t\t\t群组ID')
    console.log('----------------------------------------')
    for (const item of allInviteCodes) {
      const groupName = TEST_GROUPS[item.groupIndex - 1]?.topic || `组${item.groupIndex}`
      console.log(`${groupName}\t${item.code}\t\t${item.groupId}`)
    }

    console.log('\n【使用说明】')
    console.log('1. 每个群组有6个邀请码，每个邀请码只能使用1次')
    console.log('2. 学生使用同一群组的邀请码注册后，会自动加入该群组')
    console.log('3. 例如：6个学生都使用 GROUP1-001~GROUP1-006 注册，他们将进入"自我探索组"')
    console.log('========================================')
  } catch (error) {
    console.error('Seed failed:', error)
    process.exit(1)
  } finally {
    await dataSource.destroy()
  }
}

seed()