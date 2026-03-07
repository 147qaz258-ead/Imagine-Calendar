import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, In } from 'typeorm'
import {
  CognitiveMap,
  CognitiveDimension,
  CognitiveHistory,
  KnowledgeSource,
  KnowledgeSourceType,
} from './entities/cognitive-map.entity'
import { User } from '../user/entities/user.entity'
import { UpdateDimensionDto, CognitiveHistoryQueryDto, CompareCognitiveMapDto } from './dto'

/**
 * 默认认知维度配置
 * 对应 API-CONTRACT.md 1.4 中的认知维度
 */
const DEFAULT_DIMENSIONS: CognitiveDimension[] = [
  { name: '地点认知', score: 0, knowledgeSource: [] },
  { name: '自我定位认知', score: 0, knowledgeSource: [] },
  { name: '发展方向认知', score: 0, knowledgeSource: [] },
  { name: '行业认知', score: 0, knowledgeSource: [] },
  { name: '企业认知', score: 0, knowledgeSource: [] },
]

/**
 * 认知图谱服务
 * 实现认知维度记录、历史查询、对比分析等功能
 * 对应 API-CONTRACT.md 第 7 章
 */
@Injectable()
export class CognitiveService {
  private readonly logger = new Logger(CognitiveService.name)

  constructor(
    @InjectRepository(CognitiveMap)
    private cognitiveMapRepository: Repository<CognitiveMap>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * 获取认知图谱
   * GET /api/users/:id/cognitive-map
   * 对应 API-CONTRACT.md 7.1
   */
  async getCognitiveMap(userId: string) {
    // 验证用户是否存在
    const user = await this.userRepository.findOne({ where: { id: userId } })
    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: '用户不存在',
      })
    }

    // 查找认知图谱
    let cognitiveMap = await this.cognitiveMapRepository.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    })

    // 如果不存在，创建默认认知图谱
    if (!cognitiveMap) {
      cognitiveMap = this.cognitiveMapRepository.create({
        userId,
        dimensions: DEFAULT_DIMENSIONS,
        history: [],
      })
      await this.cognitiveMapRepository.save(cognitiveMap)
      this.logger.log(`Created default cognitive map for user ${userId}`)
    }

    return {
      success: true,
      data: this.formatCognitiveMap(cognitiveMap),
    }
  }

  /**
   * 更新认知维度
   * PUT /api/users/:id/cognitive-map/dimensions
   * 对应 API-CONTRACT.md 7.2
   */
  async updateDimension(userId: string, dto: UpdateDimensionDto) {
    // 验证用户是否存在
    const user = await this.userRepository.findOne({ where: { id: userId } })
    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: '用户不存在',
      })
    }

    // 查找认知图谱
    let cognitiveMap = await this.cognitiveMapRepository.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    })

    // 如果不存在，创建新的
    if (!cognitiveMap) {
      cognitiveMap = this.cognitiveMapRepository.create({
        userId,
        dimensions: DEFAULT_DIMENSIONS.map((d) => ({ ...d })),
        history: [],
      })
    }

    // 记录历史
    const historyEntry: CognitiveHistory = {
      date: new Date().toISOString(),
      dimensions: JSON.parse(JSON.stringify(cognitiveMap.dimensions)),
      triggeredBy: `维度更新: ${dto.dimension}`,
    }
    cognitiveMap.history = cognitiveMap.history || []
    cognitiveMap.history.push(historyEntry)

    // 更新维度
    const dimensionIndex = cognitiveMap.dimensions.findIndex((d) => d.name === dto.dimension)

    if (dimensionIndex >= 0) {
      // 更新现有维度（累加分数，最大100）
      const newScore = Math.min(cognitiveMap.dimensions[dimensionIndex].score + dto.score, 100)
      cognitiveMap.dimensions[dimensionIndex].score = newScore
      cognitiveMap.dimensions[dimensionIndex].knowledgeSource.push({
        type: dto.knowledgeSource.type,
        description: dto.knowledgeSource.description,
        depth: dto.knowledgeSource.depth,
        contributedAt: dto.knowledgeSource.contributedAt,
      })
    } else {
      // 添加新维度
      cognitiveMap.dimensions.push({
        name: dto.dimension,
        score: Math.min(dto.score, 100),
        knowledgeSource: [dto.knowledgeSource],
      })
    }

    await this.cognitiveMapRepository.save(cognitiveMap)
    this.logger.log(`Updated dimension ${dto.dimension} for user ${userId} with score ${dto.score}`)

    return {
      success: true,
      data: this.formatCognitiveMap(cognitiveMap),
    }
  }

  /**
   * 获取认知历史
   * GET /api/users/:id/cognitive-map/history
   * 对应 API-CONTRACT.md 7.3
   */
  async getCognitiveHistory(userId: string, query: CognitiveHistoryQueryDto) {
    // 验证用户是否存在
    const user = await this.userRepository.findOne({ where: { id: userId } })
    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: '用户不存在',
      })
    }

    // 查找认知图谱
    const cognitiveMap = await this.cognitiveMapRepository.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    })

    if (!cognitiveMap) {
      return {
        success: true,
        data: {
          history: [],
          trend: [],
        },
      }
    }

    // 过滤历史记录
    let history = cognitiveMap.history || []
    const { startDate, endDate } = query

    if (startDate) {
      const start = new Date(startDate)
      history = history.filter((h) => new Date(h.date) >= start)
    }

    if (endDate) {
      const end = new Date(endDate)
      history = history.filter((h) => new Date(h.date) <= end)
    }

    // 计算趋势
    const trend = this.calculateTrend(history, cognitiveMap.dimensions)

    return {
      success: true,
      data: {
        history,
        trend,
      },
    }
  }

  /**
   * 对比认知图谱
   * POST /api/cognitive-map/compare
   * 对应 API-CONTRACT.md 7.4
   */
  async compareCognitiveMaps(dto: CompareCognitiveMapDto) {
    const { userIds } = dto

    // 验证用户数量
    if (userIds.length < 2 || userIds.length > 6) {
      throw new BadRequestException({
        code: 'BAD_REQUEST',
        message: '对比用户数量必须在 2-6 人之间',
      })
    }

    // 查询所有用户
    const users = await this.userRepository.find({
      where: { id: In(userIds) },
    })

    if (users.length !== userIds.length) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: '部分用户不存在',
      })
    }

    // 查询所有认知图谱
    const cognitiveMaps = await this.cognitiveMapRepository.find({
      where: { userId: In(userIds) },
    })

    // 构建用户认知数据
    const usersData = userIds.map((userId) => {
      const user = users.find((u) => u.id === userId)!
      const cmap = cognitiveMaps.find((cm) => cm.userId === userId)

      return {
        userId,
        nickname: user.nickname || '匿名用户',
        dimensions: cmap?.dimensions || DEFAULT_DIMENSIONS,
      }
    })

    // 分析共同优势、差距和互补项
    const analysis = this.analyzeCognitiveMaps(usersData)

    return {
      success: true,
      data: {
        users: usersData,
        ...analysis,
      },
    }
  }

  // ============ 私有方法 ============

  /**
   * 格式化认知图谱响应
   */
  private formatCognitiveMap(cmap: CognitiveMap) {
    return {
      id: cmap.id,
      userId: cmap.userId,
      dimensions: cmap.dimensions,
      history: cmap.history || [],
      createdAt: cmap.createdAt.toISOString(),
      updatedAt: cmap.recordedAt?.toISOString() || cmap.createdAt.toISOString(),
    }
  }

  /**
   * 计算趋势数据
   */
  private calculateTrend(
    history: CognitiveHistory[],
    currentDimensions: CognitiveDimension[],
  ): { dimension: string; values: { date: string; score: number }[] }[] {
    // 获取所有维度名称
    const dimensionNames = currentDimensions.map((d) => d.name)

    return dimensionNames.map((name) => {
      const values: { date: string; score: number }[] = []

      // 从历史记录中提取该维度的分数
      for (const entry of history) {
        const dim = entry.dimensions.find((d) => d.name === name)
        if (dim) {
          values.push({
            date: entry.date,
            score: dim.score,
          })
        }
      }

      // 添加当前分数
      const currentDim = currentDimensions.find((d) => d.name === name)
      if (currentDim) {
        values.push({
          date: new Date().toISOString(),
          score: currentDim.score,
        })
      }

      return { dimension: name, values }
    })
  }

  /**
   * 分析多个用户的认知图谱
   */
  private analyzeCognitiveMaps(
    usersData: { userId: string; nickname: string; dimensions: CognitiveDimension[] }[],
  ): {
    commonStrengths: string[]
    commonGaps: string[]
    complementary: string[]
  } {
    const commonStrengths: string[] = []
    const commonGaps: string[] = []
    const complementary: string[] = []

    // 获取所有维度名称
    const dimensionNames = new Set<string>()
    usersData.forEach((u) => {
      u.dimensions.forEach((d) => dimensionNames.add(d.name))
    })

    // 分析每个维度
    for (const dimName of dimensionNames) {
      const scores: number[] = []
      const userScores: { userId: string; score: number }[] = []

      usersData.forEach((u) => {
        const dim = u.dimensions.find((d) => d.name === dimName)
        if (dim) {
          scores.push(dim.score)
          userScores.push({ userId: u.userId, score: dim.score })
        }
      })

      if (scores.length < 2) continue

      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length
      const minScore = Math.min(...scores)
      const maxScore = Math.max(...scores)

      // 共同优势: 平均分 >= 70
      if (avgScore >= 70) {
        commonStrengths.push(`${dimName}: 平均分 ${avgScore.toFixed(1)}`)
      }

      // 共同差距: 平均分 < 40
      if (avgScore < 40) {
        commonGaps.push(`${dimName}: 平均分 ${avgScore.toFixed(1)}`)
      }

      // 互补项: 最大分与最小分差距 >= 30
      if (maxScore - minScore >= 30) {
        const highUser = userScores.find((us) => us.score === maxScore)
        const lowUser = userScores.find((us) => us.score === minScore)
        const highUserData = usersData.find((u) => u.userId === highUser?.userId)
        const lowUserData = usersData.find((u) => u.userId === lowUser?.userId)
        complementary.push(
          `${dimName}: ${highUserData?.nickname}(${maxScore}) 可帮助 ${lowUserData?.nickname}(${minScore})`,
        )
      }
    }

    return { commonStrengths, commonGaps, complementary }
  }
}
