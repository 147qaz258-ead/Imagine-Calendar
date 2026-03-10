import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import * as bcrypt from 'bcryptjs'
import { User, UserStatus } from '../user/entities/user.entity'
import { RoundTable, RoundTableStatus } from '../roundtable/entities/roundtable.entity'
import { InviteCode, InviteCodeStatus } from '../invite-code/entities/invite-code.entity'

/**
 * 测试群组配置
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
 * 系统管理员配置
 */
const SYSTEM_ADMIN = {
  phone: '10000000000',
  password: 'Admin@123',
  nickname: '系统管理员',
}

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name)
  private readonly saltRounds = 10

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(RoundTable)
    private roundTableRepository: Repository<RoundTable>,
    @InjectRepository(InviteCode)
    private inviteCodeRepository: Repository<InviteCode>,
  ) {}

  /**
   * 初始化种子数据
   */
  async seed(): Promise<{
    success: boolean
    message: string
    data: {
      admin: { phone: string; nickname: string }
      groups: Array<{ topic: string; id: string }>
      inviteCodes: Array<{ code: string; groupId: string }>
    }
  }> {
    this.logger.log('Starting seed process...')

    try {
      // Step 1: 创建系统管理员
      let adminUser = await this.userRepository.findOne({
        where: { phone: SYSTEM_ADMIN.phone },
      })

      if (!adminUser) {
        const hashedPassword = await bcrypt.hash(SYSTEM_ADMIN.password, this.saltRounds)
        adminUser = this.userRepository.create({
          phone: SYSTEM_ADMIN.phone,
          password: hashedPassword,
          nickname: SYSTEM_ADMIN.nickname,
          status: UserStatus.ACTIVE,
        })
        await this.userRepository.save(adminUser)
        this.logger.log(`Created admin user: ${SYSTEM_ADMIN.nickname}`)
      } else {
        this.logger.log(`Admin user already exists: ${SYSTEM_ADMIN.nickname}`)
      }

      // Step 2: 创建测试群组
      const createdGroups: RoundTable[] = []

      for (const groupConfig of TEST_GROUPS) {
        let group = await this.roundTableRepository.findOne({
          where: { topic: groupConfig.topic },
        })

        if (!group) {
          group = this.roundTableRepository.create({
            topic: groupConfig.topic,
            description: groupConfig.description,
            status: groupConfig.status,
            maxParticipants: 6,
            duration: 120,
          })
          await this.roundTableRepository.save(group)
          this.logger.log(`Created group: ${groupConfig.topic}`)
        } else {
          this.logger.log(`Group already exists: ${groupConfig.topic}`)
        }

        createdGroups.push(group)
      }

      // Step 3: 创建邀请码
      const allInviteCodes: Array<{ code: string; groupId: string }> = []

      for (let i = 0; i < createdGroups.length; i++) {
        const group = createdGroups[i]

        for (let j = 1; j <= 6; j++) {
          const code = `GROUP${i + 1}-${String(j).padStart(3, '0')}`

          let existingCode = await this.inviteCodeRepository.findOne({
            where: { code },
          })

          if (!existingCode) {
            const inviteCode = this.inviteCodeRepository.create({
              code,
              groupId: group.id,
              createdBy: adminUser.id,
              maxUses: 1, // 每个邀请码只能使用1次
              status: InviteCodeStatus.ACTIVE,
            })
            await this.inviteCodeRepository.save(inviteCode)
            this.logger.log(`Created invite code: ${code}`)
          } else {
            this.logger.log(`Invite code already exists: ${code}`)
          }

          allInviteCodes.push({ code, groupId: group.id })
        }
      }

      this.logger.log('Seed completed successfully!')

      return {
        success: true,
        message: '种子数据初始化成功',
        data: {
          admin: { phone: SYSTEM_ADMIN.phone, nickname: SYSTEM_ADMIN.nickname },
          groups: createdGroups.map((g) => ({ topic: g.topic, id: g.id })),
          inviteCodes: allInviteCodes,
        },
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      this.logger.error(`Seed failed: ${errorMessage}`)
      return {
        success: false,
        message: `初始化失败: ${errorMessage}`,
        data: {
          admin: { phone: '', nickname: '' },
          groups: [],
          inviteCodes: [],
        },
      }
    }
  }
}