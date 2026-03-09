import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, In, Not } from 'typeorm'
import { RoundTable, RoundTableStatus } from './entities/roundtable.entity'
import {
  RoundTableParticipant,
  ParticipantRole,
  ParticipantStatus,
} from './entities/roundtable-participant.entity'
import { User } from '../user/entities/user.entity'
import { UserProfile, UserPreferences } from '../user/entities/user-profile.entity'
import { RoundTableQueryDto, ApplyRoundTableDto, SubmitSummaryDto } from './dto'
import { CognitiveService } from '../cognitive/cognitive.service'
import { KnowledgeSourceType } from '../cognitive/entities/cognitive-map.entity'
import { CognitiveBoundaryService } from '../cognitive-boundary/cognitive-boundary.service'

/**
 * 匹配权重配置
 * 对应 TASK-012 匹配算法
 */
const MATCH_WEIGHTS = {
  locations: 0.2, // 地点偏好
  industries: 0.2, // 行业偏好
  selfPositioning: 0.15, // 自我定位
  developmentDirection: 0.15, // 发展方向
  platformTypes: 0.1, // 平台性质
  companyScales: 0.1, // 企业规模
  companyCulture: 0.05, // 企业文化
  leadershipStyle: 0.05, // 领导风格
}

/**
 * 圆桌问题清单
 * 对应 API-CONTRACT.md 6.7 RoundTableQuestion
 */
const ROUND_TABLE_QUESTIONS = [
  {
    id: 'q1',
    category: '职业规划',
    question: '你目前的职业目标是什么？',
    followUp: ['短期目标是什么？', '长期目标是什么？'],
  },
  {
    id: 'q2',
    category: '职业规划',
    question: '你如何规划自己的职业发展路径？',
    followUp: ['有没有具体的里程碑？', '如何衡量进展？'],
  },
  {
    id: 'q3',
    category: '行业认知',
    question: '你对目标行业有什么了解？',
    followUp: ['行业发展趋势如何？', '主要挑战是什么？'],
  },
  {
    id: 'q4',
    category: '行业认知',
    question: '你认为该行业最需要什么能力？',
    followUp: ['你具备哪些？', '哪些需要提升？'],
  },
  {
    id: 'q5',
    category: '求职策略',
    question: '你准备如何准备求职？',
    followUp: ['简历准备得如何？', '面试准备得如何？'],
  },
  {
    id: 'q6',
    category: '求职策略',
    question: '你如何筛选适合自己的机会？',
    followUp: ['最看重什么因素？', '有什么标准？'],
  },
  {
    id: 'q7',
    category: '能力提升',
    question: '你目前最想提升的能力是什么？',
    followUp: ['有具体的学习计划吗？', '有什么资源支持？'],
  },
  {
    id: 'q8',
    category: '能力提升',
    question: '你如何平衡学习和实践？',
    followUp: ['有什么经验分享？', '遇到什么困难？'],
  },
]

/**
 * 圆桌信息类型
 */
export interface RoundTableInfo {
  id: string
  status: RoundTableStatus
  scheduledAt: Date | null
  participantCount: number
  topic: string | null
}

/**
 * 格式化后的参与者类型
 */
export interface FormattedParticipant {
  userId: string
  nickname: string
  avatar: string | null
  joinedAt: string | undefined
  role: ParticipantRole
}

/**
 * 格式化后的圆桌类型
 */
export interface FormattedRoundTable {
  id: string
  topic: string | null
  description: string | null
  scheduledAt: string | undefined
  duration: number
  maxParticipants: number
  participants: FormattedParticipant[]
  status: RoundTableStatus
  questions: string[]
  summary: string | null
  createdAt: string
  updatedAt: string
}

/**
 * 格式化后的消息类型
 */
export interface FormattedMessage {
  id: string
  userId: string
  nickname: string
  content: string
  contentType: string
  createdAt: string
}

/**
 * 格式化后的圆桌详情类型
 */
export interface FormattedRoundTableDetail extends FormattedRoundTable {
  messages: FormattedMessage[]
}

/**
 * 圆桌服务
 * 实现圆桌匹配、状态管理、讨论纪要等功能
 */
@Injectable()
export class RoundTableService {
  private readonly logger = new Logger(RoundTableService.name)

  constructor(
    @InjectRepository(RoundTable)
    private roundTableRepository: Repository<RoundTable>,
    @InjectRepository(RoundTableParticipant)
    private participantRepository: Repository<RoundTableParticipant>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserProfile)
    private profileRepository: Repository<UserProfile>,
    @Inject(forwardRef(() => CognitiveService))
    private cognitiveService: CognitiveService,
    @Inject(forwardRef(() => CognitiveBoundaryService))
    private cognitiveBoundaryService: CognitiveBoundaryService,
  ) {}

  /**
   * 获取圆桌列表
   * GET /api/round-tables
   * 对应 API-CONTRACT.md 6.1
   */
  async getRoundTables(query: RoundTableQueryDto) {
    const { status, page = 1, pageSize = 10 } = query

    const qb = this.roundTableRepository
      .createQueryBuilder('roundTable')
      .leftJoinAndSelect('roundTable.participants', 'participant')
      .leftJoinAndSelect('participant.user', 'user')

    if (status) {
      qb.andWhere('roundTable.status = :status', { status })
    }

    qb.skip((page - 1) * pageSize).take(pageSize)
    qb.orderBy('roundTable.createdAt', 'DESC')

    const [roundTables, total] = await qb.getManyAndCount()

    return {
      success: true,
      data: {
        roundTables: roundTables.map((rt) => this.formatRoundTable(rt)),
        total,
        page,
        pageSize,
      },
    }
  }

  /**
   * 创建圆桌报名
   * POST /api/round-tables/apply
   * 对应 API-CONTRACT.md 6.2
   */
  async apply(userId: string, dto: ApplyRoundTableDto) {
    // 获取用户偏好
    const profile = await this.profileRepository.findOne({
      where: { userId },
    })

    if (!profile) {
      throw new BadRequestException({
        code: 'PREFERENCES_INVALID',
        message: '请先完善用户偏好设置',
      })
    }

    // 检查是否已有进行中的报名
    const existingParticipant = await this.participantRepository.findOne({
      where: {
        userId,
        status: In([
          ParticipantStatus.APPLIED,
          ParticipantStatus.MATCHED,
          ParticipantStatus.JOINED,
        ]),
      },
      relations: ['roundTable'],
    })

    if (existingParticipant) {
      return {
        success: true,
        data: {
          applicationId: existingParticipant.id,
          status:
            existingParticipant.roundTable.status === RoundTableStatus.MATCHING
              ? 'pending'
              : 'matched',
          estimatedWaitTime: this.calculateEstimatedWaitTime(existingParticipant),
        },
      }
    }

    // 尝试匹配现有圆桌
    const matchedRoundTable = await this.tryMatchExistingRoundTable(userId, profile.preferences)

    if (matchedRoundTable) {
      // 加入现有圆桌
      const participant = this.participantRepository.create({
        roundTableId: matchedRoundTable.id,
        userId,
        role: ParticipantRole.MEMBER,
        status: ParticipantStatus.MATCHED,
        preferences: profile.preferences,
        matchedAt: new Date(),
      })
      await this.participantRepository.save(participant)

      // 检查是否人齐
      await this.checkAndUpdateRoundTableStatus(matchedRoundTable.id)

      this.logger.log(`User ${userId} matched to existing round table ${matchedRoundTable.id}`)

      return {
        success: true,
        data: {
          applicationId: participant.id,
          status: 'matched',
          estimatedWaitTime: 0,
        },
      }
    }

    // 创建新圆桌或加入匹配中的圆桌
    const roundTable = await this.findOrCreateMatchingRoundTable(dto.preferredTimes)

    const participant = this.participantRepository.create({
      roundTableId: roundTable.id,
      userId,
      role: roundTable.participants?.length === 0 ? ParticipantRole.HOST : ParticipantRole.MEMBER,
      status: ParticipantStatus.APPLIED,
      preferences: profile.preferences,
    })
    await this.participantRepository.save(participant)

    this.logger.log(`User ${userId} applied to round table ${roundTable.id}`)

    return {
      success: true,
      data: {
        applicationId: participant.id,
        status: 'pending',
        estimatedWaitTime: this.calculateEstimatedWaitTime(participant),
      },
    }
  }

  /**
   * 获取圆桌详情
   * GET /api/round-tables/:id
   * 对应 API-CONTRACT.md 6.3
   */
  async getRoundTableDetail(id: string) {
    const roundTable = await this.roundTableRepository.findOne({
      where: { id },
      relations: ['participants', 'participants.user', 'messages', 'messages.user'],
    })

    if (!roundTable) {
      throw new NotFoundException({
        code: 'ROUND_TABLE_NOT_FOUND',
        message: '群组不存在',
      })
    }

    return {
      success: true,
      data: this.formatRoundTableDetail(roundTable),
    }
  }

  /**
   * 加入圆桌
   * POST /api/round-tables/:id/join
   * 对应 API-CONTRACT.md 6.4
   */
  async joinRoundTable(userId: string, roundTableId: string) {
    const roundTable = await this.roundTableRepository.findOne({
      where: { id: roundTableId },
      relations: ['participants'],
    })

    if (!roundTable) {
      throw new NotFoundException({
        code: 'ROUND_TABLE_NOT_FOUND',
        message: '群组不存在',
      })
    }

    // 检查状态
    if (roundTable.status === RoundTableStatus.MATCHING) {
      throw new BadRequestException({
        code: 'ROUND_TABLE_NOT_READY',
        message: '群组还在匹配中',
      })
    }

    if (roundTable.status === RoundTableStatus.COMPLETED) {
      throw new BadRequestException({
        code: 'ROUND_TABLE_ALREADY_STARTED',
        message: '群组已结束',
      })
    }

    // 检查是否已满
    const activeParticipants = roundTable.participants.filter(
      (p) => p.status === ParticipantStatus.JOINED || p.status === ParticipantStatus.MATCHED,
    )

    if (activeParticipants.length >= roundTable.maxParticipants) {
      throw new BadRequestException({
        code: 'ROUND_TABLE_FULL',
        message: '群组已满',
      })
    }

    // 查找参与者记录
    let participant = await this.participantRepository.findOne({
      where: { roundTableId, userId },
    })

    if (!participant) {
      // 新加入
      const profile = await this.profileRepository.findOne({
        where: { userId },
      })

      participant = this.participantRepository.create({
        roundTableId,
        userId,
        role: ParticipantRole.MEMBER,
        status: ParticipantStatus.JOINED,
        preferences: profile?.preferences || {},
        joinedAt: new Date(),
      })
    } else {
      participant.status = ParticipantStatus.JOINED
      participant.joinedAt = new Date()
    }

    await this.participantRepository.save(participant)

    // 更新圆桌状态
    if (roundTable.status === RoundTableStatus.READY) {
      roundTable.status = RoundTableStatus.IN_PROGRESS
      await this.roundTableRepository.save(roundTable)
    }

    this.logger.log(`User ${userId} joined round table ${roundTableId}`)

    const updatedRoundTable = await this.roundTableRepository.findOne({
      where: { id: roundTableId },
      relations: ['participants', 'participants.user'],
    })

    return {
      success: true,
      data: {
        roundTable: this.formatRoundTable(updatedRoundTable!),
        wsEndpoint: `/round-tables/${roundTableId}/ws`,
      },
    }
  }

  /**
   * 离开圆桌
   * POST /api/round-tables/:id/leave
   * 对应 API-CONTRACT.md 6.5
   */
  async leaveRoundTable(userId: string, roundTableId: string) {
    const participant = await this.participantRepository.findOne({
      where: { roundTableId, userId },
      relations: ['roundTable', 'roundTable.participants'],
    })

    if (!participant) {
      throw new BadRequestException({
        code: 'ROUND_TABLE_NOT_PARTICIPANT',
        message: '你不是该群组的参与者',
      })
    }

    participant.status = ParticipantStatus.LEFT
    await this.participantRepository.save(participant)

    // 检查是否需要取消圆桌
    const roundTable = participant.roundTable
    const activeParticipants = roundTable.participants.filter(
      (p) => p.status === ParticipantStatus.JOINED || p.status === ParticipantStatus.MATCHED,
    )

    if (activeParticipants.length < 2 && roundTable.status !== RoundTableStatus.COMPLETED) {
      roundTable.status = RoundTableStatus.CANCELLED
      await this.roundTableRepository.save(roundTable)
    }

    this.logger.log(`User ${userId} left round table ${roundTableId}`)

    return {
      success: true,
      data: {
        left: true,
        roundTable:
          roundTable.status === RoundTableStatus.CANCELLED
            ? undefined
            : this.formatRoundTable(roundTable),
      },
    }
  }

  /**
   * 提交讨论纪要
   * POST /api/round-tables/:id/summary
   * 对应 API-CONTRACT.md 6.6
   */
  async submitSummary(userId: string, roundTableId: string, dto: SubmitSummaryDto) {
    const participant = await this.participantRepository.findOne({
      where: { roundTableId, userId },
      relations: ['roundTable'],
    })

    if (!participant) {
      throw new BadRequestException({
        code: 'ROUND_TABLE_NOT_PARTICIPANT',
        message: '你不是该群组的参与者',
      })
    }

    const roundTable = participant.roundTable
    roundTable.summary = dto.summary
    roundTable.status = RoundTableStatus.COMPLETED
    await this.roundTableRepository.save(roundTable)

    this.logger.log(`Summary submitted for round table ${roundTableId}`)

    // 更新认知图谱 - 圆桌讨论可提升各维度认知
    let cognitiveMapUpdate = null
    try {
      cognitiveMapUpdate = await this.updateCognitiveMapAfterRoundTable(
        userId,
        roundTableId,
        dto.keyPoints,
      )
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      this.logger.warn(`Failed to update cognitive map: ${errorMessage}`)
    }

    return {
      success: true,
      data: {
        roundTable: this.formatRoundTable(roundTable),
        cognitiveMapUpdate,
      },
    }
  }

  /**
   * 获取圆桌问题清单
   * GET /api/round-tables/questions
   * 对应 API-CONTRACT.md 6.7
   */
  async getQuestions() {
    return {
      success: true,
      data: {
        questions: ROUND_TABLE_QUESTIONS,
      },
    }
  }

  /**
   * 获取我的圆桌
   * GET /api/round-tables/my
   */
  async getMyRoundTables(userId: string) {
    const participants = await this.participantRepository.find({
      where: {
        userId,
        status: Not(In([ParticipantStatus.LEFT, ParticipantStatus.CANCELLED])),
      },
      relations: ['roundTable', 'roundTable.participants', 'roundTable.participants.user'],
      order: { createdAt: 'DESC' },
    })

    const matching: RoundTableInfo[] = []
    const upcoming: RoundTableInfo[] = []
    const completed: RoundTableInfo[] = []

    for (const p of participants) {
      const rt = p.roundTable
      const info: RoundTableInfo = {
        id: rt.id,
        status: rt.status,
        scheduledAt: rt.scheduledAt,
        participantCount:
          rt.participants?.filter(
            (pt) =>
              pt.status !== ParticipantStatus.LEFT && pt.status !== ParticipantStatus.CANCELLED,
          ).length || 0,
        topic: rt.topic,
      }

      switch (rt.status) {
        case RoundTableStatus.MATCHING:
          matching.push(info)
          break
        case RoundTableStatus.READY:
        case RoundTableStatus.IN_PROGRESS:
          upcoming.push(info)
          break
        case RoundTableStatus.COMPLETED:
          completed.push(info)
          break
      }
    }

    return {
      success: true,
      data: { matching, upcoming, completed },
    }
  }

  /**
   * 取消报名
   * POST /api/round-tables/:id/cancel
   */
  async cancelApplication(userId: string, roundTableId: string) {
    const participant = await this.participantRepository.findOne({
      where: { roundTableId, userId },
    })

    if (!participant) {
      throw new BadRequestException({
        code: 'ROUND_TABLE_NOT_PARTICIPANT',
        message: '未找到报名记录',
      })
    }

    if (participant.status === ParticipantStatus.JOINED) {
      throw new BadRequestException({
        code: 'ROUND_TABLE_ALREADY_STARTED',
        message: '已加入的群组无法取消，请选择离开',
      })
    }

    participant.status = ParticipantStatus.CANCELLED
    await this.participantRepository.save(participant)

    this.logger.log(`User ${userId} cancelled application for round table ${roundTableId}`)

    return { success: true }
  }

  /**
   * 自动匹配圆桌
   * 当用户完成个性化选择后自动触发
   * POST /api/round-tables/auto-match
   */
  async autoMatch(userId: string) {
    // 获取用户偏好
    const profile = await this.profileRepository.findOne({
      where: { userId },
    })

    if (!profile || !profile.preferences) {
      throw new BadRequestException({
        code: 'PREFERENCES_INVALID',
        message: '请先完善个性化选择',
      })
    }

    // 检查是否已有进行中的匹配
    const existingParticipant = await this.participantRepository.findOne({
      where: {
        userId,
        status: In([
          ParticipantStatus.APPLIED,
          ParticipantStatus.MATCHED,
          ParticipantStatus.JOINED,
        ]),
      },
      relations: ['roundTable'],
    })

    if (existingParticipant) {
      return {
        success: true,
        data: {
          matched: existingParticipant.roundTable.status !== RoundTableStatus.MATCHING,
          roundTableId: existingParticipant.roundTableId,
          status: existingParticipant.roundTable.status,
          participantCount: existingParticipant.roundTable.participants?.length || 1,
        },
      }
    }

    // 尝试匹配现有圆桌
    const matchedRoundTable = await this.tryMatchExistingRoundTable(userId, profile.preferences)

    if (matchedRoundTable) {
      // 加入现有圆桌
      const participant = this.participantRepository.create({
        roundTableId: matchedRoundTable.id,
        userId,
        role: ParticipantRole.MEMBER,
        status: ParticipantStatus.MATCHED,
        preferences: profile.preferences,
        matchedAt: new Date(),
      })
      await this.participantRepository.save(participant)

      // 检查是否人齐
      await this.checkAndUpdateRoundTableStatus(matchedRoundTable.id)

      this.logger.log(`User ${userId} auto-matched to round table ${matchedRoundTable.id}`)

      const updatedRoundTable = await this.roundTableRepository.findOne({
        where: { id: matchedRoundTable.id },
        relations: ['participants'],
      })

      return {
        success: true,
        data: {
          matched: true,
          roundTableId: matchedRoundTable.id,
          status: updatedRoundTable?.status,
          participantCount: updatedRoundTable?.participants?.length || 1,
        },
      }
    }

    // 创建新圆桌或加入匹配中的圆桌
    const roundTable = await this.findOrCreateMatchingRoundTable([])

    const participant = this.participantRepository.create({
      roundTableId: roundTable.id,
      userId,
      role: ParticipantRole.HOST,
      status: ParticipantStatus.APPLIED,
      preferences: profile.preferences,
    })
    await this.participantRepository.save(participant)

    this.logger.log(`User ${userId} auto-matched to new round table ${roundTable.id}`)

    return {
      success: true,
      data: {
        matched: false,
        roundTableId: roundTable.id,
        status: RoundTableStatus.MATCHING,
        participantCount: 1,
      },
    }
  }

  /**
   * 直接将用户加入指定群组
   * 用于邀请码关联群组的场景
   * @param userId 用户ID
   * @param groupId 群组ID（RoundTable ID）
   */
  async addUserToGroup(
    userId: string,
    groupId: string,
  ): Promise<{
    success: boolean
    participantId: string
    roundTableId: string
  }> {
    // 验证群组存在
    const roundTable = await this.roundTableRepository.findOne({
      where: { id: groupId },
      relations: ['participants'],
    })

    if (!roundTable) {
      throw new NotFoundException({
        code: 'ROUND_TABLE_NOT_FOUND',
        message: '群组不存在',
      })
    }

    // 检查群组状态是否允许加入
    if (roundTable.status === RoundTableStatus.COMPLETED) {
      throw new BadRequestException({
        code: 'ROUND_TABLE_ALREADY_COMPLETED',
        message: '该群组已结束，无法加入',
      })
    }

    if (roundTable.status === RoundTableStatus.CANCELLED) {
      throw new BadRequestException({
        code: 'ROUND_TABLE_CANCELLED',
        message: '该群组已取消，无法加入',
      })
    }

    // 检查是否已满
    const activeParticipants = (roundTable.participants || []).filter(
      (p) =>
        p.status === ParticipantStatus.MATCHED ||
        p.status === ParticipantStatus.JOINED ||
        p.status === ParticipantStatus.APPLIED,
    )

    if (activeParticipants.length >= roundTable.maxParticipants) {
      throw new BadRequestException({
        code: 'ROUND_TABLE_FULL',
        message: '该群组已满员',
      })
    }

    // 检查用户是否已经在该群组中
    const existingParticipant = await this.participantRepository.findOne({
      where: { roundTableId: groupId, userId },
    })

    if (existingParticipant) {
      // 如果用户已存在但状态为取消或离开，则重新激活
      if (
        existingParticipant.status === ParticipantStatus.CANCELLED ||
        existingParticipant.status === ParticipantStatus.LEFT
      ) {
        existingParticipant.status = ParticipantStatus.MATCHED
        existingParticipant.matchedAt = new Date()
        await this.participantRepository.save(existingParticipant)

        this.logger.log(`User ${userId} re-joined group ${groupId}`)

        return {
          success: true,
          participantId: existingParticipant.id,
          roundTableId: groupId,
        }
      }

      // 用户已是活跃成员
      this.logger.log(`User ${userId} already in group ${groupId}`)
      return {
        success: true,
        participantId: existingParticipant.id,
        roundTableId: groupId,
      }
    }

    // 获取用户偏好（如果有）
    const profile = await this.profileRepository.findOne({
      where: { userId },
    })

    // 创建新的参与者记录
    const participant = this.participantRepository.create({
      roundTableId: groupId,
      userId,
      role: ParticipantRole.MEMBER,
      status: ParticipantStatus.MATCHED,
      preferences: profile?.preferences || {},
      matchedAt: new Date(),
    })
    await this.participantRepository.save(participant)

    // 检查是否人齐，更新群组状态
    await this.checkAndUpdateRoundTableStatus(groupId)

    this.logger.log(`User ${userId} added to group ${groupId} via invite code`)

    return {
      success: true,
      participantId: participant.id,
      roundTableId: groupId,
    }
  }

  // ============ 私有方法 ============

  /**
   * 尝试匹配现有圆桌
   */
  private async tryMatchExistingRoundTable(
    userId: string,
    preferences: UserPreferences,
  ): Promise<RoundTable | null> {
    // 查找状态为 matching 且未满的圆桌
    const roundTables = await this.roundTableRepository.find({
      where: { status: RoundTableStatus.MATCHING },
      relations: ['participants'],
    })

    let bestMatch: RoundTable | null = null
    let bestScore = 0

    for (const rt of roundTables) {
      const activeParticipants = (rt.participants || []).filter(
        (p) => p.status === ParticipantStatus.APPLIED || p.status === ParticipantStatus.MATCHED,
      )

      // 检查是否已满
      if (activeParticipants.length >= rt.maxParticipants) {
        continue
      }

      // 计算与现有参与者的平均相似度
      let totalScore = 0
      for (const p of activeParticipants) {
        if (p.userId !== userId) {
          const pPrefs = p.preferences as UserPreferences
          totalScore += this.calculateSimilarity(preferences, pPrefs)
        }
      }

      const avgScore = activeParticipants.length > 0 ? totalScore / activeParticipants.length : 0.5

      if (avgScore > bestScore && avgScore > 0.3) {
        bestScore = avgScore
        bestMatch = rt
      }
    }

    return bestMatch
  }

  /**
   * 查找或创建匹配中的圆桌
   */
  private async findOrCreateMatchingRoundTable(_preferredTimes: string[]): Promise<RoundTable> {
    // 查找最新的 matching 状态圆桌
    let roundTable = await this.roundTableRepository.findOne({
      where: { status: RoundTableStatus.MATCHING },
      relations: ['participants'],
      order: { createdAt: 'DESC' },
    })

    if (roundTable) {
      const activeParticipants =
        roundTable.participants?.filter(
          (p) => p.status === ParticipantStatus.APPLIED || p.status === ParticipantStatus.MATCHED,
        ) || []

      if (activeParticipants.length < roundTable.maxParticipants) {
        return roundTable
      }
    }

    // 创建新圆桌
    roundTable = this.roundTableRepository.create({
      status: RoundTableStatus.MATCHING,
      maxParticipants: 6,
      duration: 120,
      questions: ROUND_TABLE_QUESTIONS.map((q) => q.question),
    })
    await this.roundTableRepository.save(roundTable)

    return roundTable
  }

  /**
   * 检查并更新圆桌状态
   */
  private async checkAndUpdateRoundTableStatus(roundTableId: string): Promise<void> {
    const roundTable = await this.roundTableRepository.findOne({
      where: { id: roundTableId },
      relations: ['participants'],
    })

    if (!roundTable) return

    const activeParticipants = (roundTable.participants || []).filter(
      (p) => p.status === ParticipantStatus.MATCHED || p.status === ParticipantStatus.JOINED,
    )

    if (activeParticipants.length >= roundTable.maxParticipants) {
      roundTable.status = RoundTableStatus.READY
      // 设置默认时间（24小时后）
      roundTable.scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
      await this.roundTableRepository.save(roundTable)

      // 触发组长确认流程
      await this.onGroupFull(roundTableId)

      this.logger.log(
        `Round table ${roundTableId} is ready with ${activeParticipants.length} participants`,
      )
    }
  }

  /**
   * 群组满6人时触发组长确认流程
   * TASK-4.2: 组长确认机制完善
   */
  async onGroupFull(roundTableId: string): Promise<void> {
    // 1. 设置确认截止时间（12小时后）
    const deadline = new Date(Date.now() + 12 * 60 * 60 * 1000)

    // 2. 更新所有匹配状态的参与者的确认截止时间
    await this.participantRepository.update(
      { roundTableId, status: ParticipantStatus.MATCHED },
      { leaderConfirmDeadline: deadline },
    )

    // 3. 发送系统消息通知
    await this.sendLeaderConfirmMessage(roundTableId, deadline)

    // 4. 设置定时任务（12小时后检查）
    await this.scheduleLeaderCheck(roundTableId, deadline)

    this.logger.log(`Leader confirm flow triggered for round table ${roundTableId}, deadline: ${deadline.toISOString()}`)
  }

  /**
   * 用户确认成为组长
   * TASK-4.2: 组长确认机制完善
   */
  async confirmAsLeader(userId: string, roundTableId: string) {
    // 检查是否已有组长
    const existingLeader = await this.participantRepository.findOne({
      where: { roundTableId, isLeader: true },
    })

    if (existingLeader) {
      throw new BadRequestException({
        code: 'LEADER_ALREADY_EXISTS',
        message: '该群组已有组长',
      })
    }

    // 检查用户是否是该群组的参与者
    const participant = await this.participantRepository.findOne({
      where: { roundTableId, userId },
    })

    if (!participant) {
      throw new BadRequestException({
        code: 'NOT_PARTICIPANT',
        message: '你不是该群组的参与者',
      })
    }

    // 检查确认截止时间是否已过
    if (participant.leaderConfirmDeadline && new Date() > participant.leaderConfirmDeadline) {
      throw new BadRequestException({
        code: 'CONFIRM_DEADLINE_PASSED',
        message: '确认时间已过',
      })
    }

    // 设置为组长
    await this.participantRepository.update(
      { userId, roundTableId },
      {
        isLeader: true,
        role: ParticipantRole.HOST,
        status: ParticipantStatus.LEADER_CONFIRMED,
        leaderConfirmDeadline: null, // 清除截止时间
      },
    )

    // 清除其他参与者的确认截止时间
    await this.participantRepository.update(
      { roundTableId, isLeader: false },
      { leaderConfirmDeadline: null },
    )

    // 发送确认消息
    await this.sendLeaderConfirmedMessage(roundTableId, userId)

    this.logger.log(`User ${userId} confirmed as leader for round table ${roundTableId}`)

    const updatedRoundTable = await this.roundTableRepository.findOne({
      where: { id: roundTableId },
      relations: ['participants', 'participants.user'],
    })

    return {
      success: true,
      data: {
        roundTable: updatedRoundTable ? this.formatRoundTable(updatedRoundTable) : null,
      },
    }
  }

  /**
   * 获取组长确认状态
   * TASK-4.2: 组长确认机制完善
   */
  async getLeaderConfirmStatus(roundTableId: string, userId: string) {
    const participants = await this.participantRepository.find({
      where: { roundTableId },
      relations: ['user'],
    })

    const currentLeader = participants.find((p) => p.isLeader)
    const currentUserParticipant = participants.find((p) => p.userId === userId)

    // 检查是否需要组长确认（满6人且无组长）
    const needsConfirm =
      !currentLeader &&
      currentUserParticipant?.leaderConfirmDeadline &&
      new Date() < currentUserParticipant.leaderConfirmDeadline

    return {
      success: true,
      data: {
        hasLeader: !!currentLeader,
        leader: currentLeader
          ? {
              userId: currentLeader.userId,
              nickname: currentLeader.user?.nickname || '匿名用户',
            }
          : null,
        needsConfirm,
        deadline: currentUserParticipant?.leaderConfirmDeadline?.toISOString() || null,
        canConfirm:
          needsConfirm &&
          currentUserParticipant?.status === ParticipantStatus.MATCHED,
        remainingTime: currentUserParticipant?.leaderConfirmDeadline
          ? Math.max(
              0,
              Math.floor(
                (currentUserParticipant.leaderConfirmDeadline.getTime() - Date.now()) / 1000,
              ),
            )
          : 0,
      },
    }
  }

  /**
   * 获取问题清单完成状态
   * TASK-4.3: 问题清单完成状态
   */
  async getQuestionnaireStatus(groupId: string) {
    const participants = await this.participantRepository.find({
      where: { roundTableId: groupId },
      relations: ['user'],
    })

    // 获取每个参与者的认知边界评估状态
    const statusList = await Promise.all(
      participants.map(async (p) => {
        try {
          const assessment = await this.cognitiveBoundaryService.getAssessment(p.userId)
          const data = assessment?.data
          return {
            userId: p.userId,
            nickname: p.user?.nickname || '匿名用户',
            avatar: p.user?.avatar,
            completed: data?.completedAt != null,
            progress: data?.assessedQuestions || 0,
            total: data?.totalQuestions || 65,
          }
        } catch {
          // 如果获取失败，返回未完成状态
          return {
            userId: p.userId,
            nickname: p.user?.nickname || '匿名用户',
            avatar: p.user?.avatar,
            completed: false,
            progress: 0,
            total: 65,
          }
        }
      }),
    )

    return {
      success: true,
      data: {
        total: participants.length,
        completed: statusList.filter((s) => s.completed).length,
        statusList,
      },
    }
  }

  /**
   * 12小时后自动指定组长
   * TASK-4.2: 组长确认机制完善
   */
  async assignRandomLeader(roundTableId: string) {
    const participants = await this.participantRepository.find({
      where: { roundTableId, status: ParticipantStatus.MATCHED },
    })

    // 检查是否已有组长
    const allParticipants = await this.participantRepository.find({
      where: { roundTableId },
    })

    if (allParticipants.some((p) => p.isLeader)) {
      this.logger.log(`Round table ${roundTableId} already has a leader, skip auto assign`)
      return
    }

    if (participants.length === 0) {
      this.logger.warn(`No matched participants found for round table ${roundTableId}`)
      return
    }

    // 随机选择一个
    const randomIndex = Math.floor(Math.random() * participants.length)
    const newLeader = participants[randomIndex]

    await this.participantRepository.update(
      { id: newLeader.id },
      {
        isLeader: true,
        role: ParticipantRole.HOST,
        status: ParticipantStatus.LEADER_CONFIRMED,
        leaderConfirmDeadline: null,
      },
    )

    // 清除其他参与者的确认截止时间
    await this.participantRepository.update(
      { roundTableId, isLeader: false },
      { leaderConfirmDeadline: null },
    )

    await this.sendLeaderAssignedMessage(roundTableId, newLeader.userId)

    this.logger.log(
      `Random leader assigned for round table ${roundTableId}: user ${newLeader.userId}`,
    )
  }

  /**
   * 发送组长确认请求消息
   */
  private async sendLeaderConfirmMessage(roundTableId: string, deadline: Date): Promise<void> {
    // TODO: 实现消息发送（可通过 WebSocket 或消息表）
    this.logger.log(
      `Leader confirm message sent for round table ${roundTableId}, deadline: ${deadline.toISOString()}`,
    )
  }

  /**
   * 发送组长确认成功消息
   */
  private async sendLeaderConfirmedMessage(roundTableId: string, userId: string): Promise<void> {
    // TODO: 实现消息发送
    this.logger.log(`Leader confirmed message sent for round table ${roundTableId}, user: ${userId}`)
  }

  /**
   * 发送组长自动指定消息
   */
  private async sendLeaderAssignedMessage(roundTableId: string, userId: string): Promise<void> {
    // TODO: 实现消息发送
    this.logger.log(`Leader assigned message sent for round table ${roundTableId}, user: ${userId}`)
  }

  /**
   * 设置定时任务检查组长确认
   */
  private async scheduleLeaderCheck(roundTableId: string, deadline: Date): Promise<void> {
    // TODO: 使用定时任务框架（如 @nestjs/schedule 或 Bull）
    // 这里暂时使用简单的 setTimeout（生产环境需要持久化定时任务）
    const delay = deadline.getTime() - Date.now()
    if (delay > 0) {
      setTimeout(async () => {
        try {
          await this.assignRandomLeader(roundTableId)
        } catch (error) {
          this.logger.error(`Failed to auto assign leader for ${roundTableId}: ${error}`)
        }
      }, delay)
      this.logger.log(`Scheduled leader check for ${roundTableId} in ${delay}ms`)
    }
  }

  /**
   * 计算两个用户的相似度
   * 对应 TASK-012 匹配算法
   */
  private calculateSimilarity(p1: UserPreferences, p2: UserPreferences): number {
    let totalScore = 0
    let totalWeight = 0

    for (const [key, weight] of Object.entries(MATCH_WEIGHTS)) {
      const arr1 = (p1 as unknown as Record<string, unknown>)[key] as string[] | undefined
      const arr2 = (p2 as unknown as Record<string, unknown>)[key] as string[] | undefined

      if (arr1 && arr2 && arr1.length > 0 && arr2.length > 0) {
        const overlap = arr1.filter((v) => arr2.includes(v))
        const union = [...new Set([...arr1, ...arr2])]
        const similarity = overlap.length / union.length
        totalScore += similarity * weight
      }
      totalWeight += weight
    }

    return totalWeight > 0 ? totalScore / totalWeight : 0
  }

  /**
   * 计算预计等待时间
   */
  private calculateEstimatedWaitTime(participant: RoundTableParticipant): number {
    // 简单估算：基于当前匹配人数
    const hoursSinceApplied = participant.createdAt
      ? (Date.now() - participant.createdAt.getTime()) / (1000 * 60 * 60)
      : 0

    // 假设平均每小时有 0.5 人报名
    const estimatedHours = Math.max(0, 72 - hoursSinceApplied)
    return Math.round(estimatedHours * 60) // 返回分钟
  }

  /**
   * 格式化圆桌列表项
   */
  private formatRoundTable(rt: RoundTable): FormattedRoundTable {
    const participants =
      rt.participants?.map((p) => ({
        userId: p.userId,
        nickname: p.user?.nickname || '匿名用户',
        avatar: p.user?.avatar,
        joinedAt: p.joinedAt?.toISOString(),
        role: p.role,
      })) || []

    return {
      id: rt.id,
      topic: rt.topic,
      description: rt.description,
      scheduledAt: rt.scheduledAt?.toISOString(),
      duration: rt.duration,
      maxParticipants: rt.maxParticipants,
      participants,
      status: rt.status,
      questions: rt.questions || [],
      summary: rt.summary,
      createdAt: rt.createdAt.toISOString(),
      updatedAt: rt.updatedAt.toISOString(),
    }
  }

  /**
   * 格式化圆桌详情
   */
  private formatRoundTableDetail(rt: RoundTable): FormattedRoundTableDetail {
    const base = this.formatRoundTable(rt)

    const messages =
      rt.messages?.map((m) => ({
        id: m.id,
        userId: m.userId,
        nickname: m.user?.nickname || '匿名用户',
        content: m.content,
        contentType: m.messageType,
        createdAt: m.createdAt.toISOString(),
      })) || []

    return { ...base, messages }
  }

  /**
   * 圆桌讨论后更新认知图谱
   * 根据讨论关键点更新各维度认知分数
   */
  private async updateCognitiveMapAfterRoundTable(
    userId: string,
    roundTableId: string,
    keyPoints: string[],
  ) {
    // 圆桌讨论对认知的提升分数（基础分 + 关键点加成）
    const baseScore = 10
    const keyPointBonus = Math.min(keyPoints.length * 2, 10)
    const totalScore = baseScore + keyPointBonus

    // 更新各维度
    const dimensions = ['地点认知', '自我定位认知', '发展方向认知', '行业认知', '企业认知']
    const result: Record<string, unknown> = {}

    for (const dimension of dimensions) {
      try {
        const updateResult = await this.cognitiveService.updateDimension(userId, {
          dimension,
          score: totalScore,
          knowledgeSource: {
            type: KnowledgeSourceType.ROUND_TABLE,
            description: `群组讨论贡献: ${keyPoints.slice(0, 3).join(', ')}`,
            depth: 2,
            contributedAt: new Date().toISOString(),
          },
        })
        result[dimension] = updateResult
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        this.logger.warn(`Failed to update dimension ${dimension}: ${errorMessage}`)
      }
    }

    return result
  }
}
