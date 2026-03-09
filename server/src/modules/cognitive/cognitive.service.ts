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
import { CognitiveVersion } from './entities/cognitive-version.entity'
import { User } from '../user/entities/user.entity'
import {
  UpdateDimensionDto,
  CognitiveHistoryQueryDto,
  CompareCognitiveMapDto,
  CreateCognitiveVersionDto,
  CompareVersionsQueryDto,
} from './dto'

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
 * 维度差异接口
 */
export interface DimensionDiff {
  name: string
  scoreV1: number
  scoreV2: number
  change: number
  changePercent: number
}

/**
 * 版本对比结果接口
 */
export interface VersionComparison {
  v1: {
    id: string
    versionNumber: number
    versionName: string | null
    createdAt: string
    dimensions: CognitiveDimension[]
  }
  v2: {
    id: string
    versionNumber: number
    versionName: string | null
    createdAt: string
    dimensions: CognitiveDimension[]
  }
  diffs: DimensionDiff[]
  overallChange: number
  improvedDimensions: string[]
  declinedDimensions: string[]
}

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
    @InjectRepository(CognitiveVersion)
    private cognitiveVersionRepository: Repository<CognitiveVersion>,
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

  // ============ 版本管理方法 ============

  /**
   * 获取用户所有认知版本
   * GET /api/cognitive/versions
   */
  async getCognitiveVersions(userId: string) {
    // 验证用户是否存在
    const user = await this.userRepository.findOne({ where: { id: userId } })
    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: '用户不存在',
      })
    }

    // 查询所有版本
    const versions = await this.cognitiveVersionRepository.find({
      where: { userId },
      order: { versionNumber: 'DESC' },
    })

    return {
      success: true,
      data: versions.map((v) => ({
        id: v.id,
        userId: v.userId,
        versionNumber: v.versionNumber,
        versionName: v.versionName,
        description: v.description,
        triggerType: v.triggerType,
        roundTableId: v.roundTableId,
        createdAt: v.createdAt.toISOString(),
        dimensionCount: v.dimensions.length,
        totalScore: v.dimensions.reduce((sum, d) => sum + d.score, 0),
      })),
    }
  }

  /**
   * 创建新版本
   * POST /api/cognitive/versions
   */
  async createCognitiveVersion(userId: string, dto: CreateCognitiveVersionDto) {
    // 验证用户是否存在
    const user = await this.userRepository.findOne({ where: { id: userId } })
    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: '用户不存在',
      })
    }

    // 获取当前认知图谱
    let cognitiveMap = await this.cognitiveMapRepository.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    })

    // 如果不存在，创建默认图谱
    if (!cognitiveMap) {
      cognitiveMap = this.cognitiveMapRepository.create({
        userId,
        dimensions: DEFAULT_DIMENSIONS.map((d) => ({ ...d })),
        history: [],
      })
      await this.cognitiveMapRepository.save(cognitiveMap)
    }

    // 获取最大版本号
    const latestVersion = await this.cognitiveVersionRepository.findOne({
      where: { userId },
      order: { versionNumber: 'DESC' },
    })

    const versionNumber = (latestVersion?.versionNumber || 0) + 1

    // 创建新版本
    const newVersion = this.cognitiveVersionRepository.create({
      userId,
      versionNumber,
      versionName: dto.versionName || `版本 ${versionNumber}`,
      description: dto.description || null,
      dimensions: JSON.parse(JSON.stringify(cognitiveMap.dimensions)),
      roundTableId: dto.roundTableId || null,
      triggerType: dto.triggerType || 'manual',
    })

    await this.cognitiveVersionRepository.save(newVersion)
    this.logger.log(`Created cognitive version ${versionNumber} for user ${userId}`)

    return {
      success: true,
      data: {
        id: newVersion.id,
        userId: newVersion.userId,
        versionNumber: newVersion.versionNumber,
        versionName: newVersion.versionName,
        description: newVersion.description,
        dimensions: newVersion.dimensions,
        roundTableId: newVersion.roundTableId,
        triggerType: newVersion.triggerType,
        createdAt: newVersion.createdAt.toISOString(),
      },
    }
  }

  /**
   * 获取单个版本详情
   * GET /api/cognitive/versions/:id
   */
  async getCognitiveVersionById(versionId: string) {
    const version = await this.cognitiveVersionRepository.findOne({
      where: { id: versionId },
    })

    if (!version) {
      throw new NotFoundException({
        code: 'VERSION_NOT_FOUND',
        message: '版本不存在',
      })
    }

    return {
      success: true,
      data: {
        id: version.id,
        userId: version.userId,
        versionNumber: version.versionNumber,
        versionName: version.versionName,
        description: version.description,
        dimensions: version.dimensions,
        roundTableId: version.roundTableId,
        triggerType: version.triggerType,
        createdAt: version.createdAt.toISOString(),
      },
    }
  }

  /**
   * 对比两个版本
   * GET /api/cognitive/compare?v1=xxx&v2=xxx
   */
  async compareVersions(query: CompareVersionsQueryDto): Promise<{ success: boolean; data: VersionComparison }> {
    const { v1, v2 } = query

    // 查询两个版本
    const version1 = await this.cognitiveVersionRepository.findOne({
      where: { id: v1 },
    })
    const version2 = await this.cognitiveVersionRepository.findOne({
      where: { id: v2 },
    })

    if (!version1 || !version2) {
      throw new NotFoundException({
        code: 'VERSION_NOT_FOUND',
        message: '一个或多个版本不存在',
      })
    }

    // 验证是同一用户的版本
    if (version1.userId !== version2.userId) {
      throw new BadRequestException({
        code: 'BAD_REQUEST',
        message: '只能对比同一用户的版本',
      })
    }

    // 计算差异
    const diffs = this.calculateVersionDiffs(version1.dimensions, version2.dimensions)

    // 计算整体变化
    const overallChange = diffs.reduce((sum, d) => sum + d.change, 0)

    // 找出改进和退步的维度
    const improvedDimensions = diffs.filter((d) => d.change > 0).map((d) => d.name)
    const declinedDimensions = diffs.filter((d) => d.change < 0).map((d) => d.name)

    return {
      success: true,
      data: {
        v1: {
          id: version1.id,
          versionNumber: version1.versionNumber,
          versionName: version1.versionName,
          createdAt: version1.createdAt.toISOString(),
          dimensions: version1.dimensions,
        },
        v2: {
          id: version2.id,
          versionNumber: version2.versionNumber,
          versionName: version2.versionName,
          createdAt: version2.createdAt.toISOString(),
          dimensions: version2.dimensions,
        },
        diffs,
        overallChange,
        improvedDimensions,
        declinedDimensions,
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

  /**
   * 计算两个版本之间的维度差异
   */
  private calculateVersionDiffs(
    dimensionsV1: CognitiveDimension[],
    dimensionsV2: CognitiveDimension[],
  ): DimensionDiff[] {
    // 获取所有维度名称
    const dimensionNames = new Set<string>()
    dimensionsV1.forEach((d) => dimensionNames.add(d.name))
    dimensionsV2.forEach((d) => dimensionNames.add(d.name))

    const diffs: DimensionDiff[] = []

    for (const name of dimensionNames) {
      const dimV1 = dimensionsV1.find((d) => d.name === name)
      const dimV2 = dimensionsV2.find((d) => d.name === name)

      const scoreV1 = dimV1?.score ?? 0
      const scoreV2 = dimV2?.score ?? 0
      const change = scoreV2 - scoreV1
      const changePercent = scoreV1 > 0 ? Math.round((change / scoreV1) * 100) : (change > 0 ? 100 : 0)

      diffs.push({
        name,
        scoreV1,
        scoreV2,
        change,
        changePercent,
      })
    }

    // 按变化幅度排序（绝对值从大到小）
    return diffs.sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
  }
}