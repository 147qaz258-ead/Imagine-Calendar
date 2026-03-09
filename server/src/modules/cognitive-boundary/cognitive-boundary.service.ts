import { Injectable, NotFoundException, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import {
  CognitiveBoundaryAssessment,
  DimensionAssessmentData,
  QuestionAssessmentData,
  SubCategoryStats,
  AssessmentStage,
} from './entities/cognitive-boundary-assessment.entity'
import { User } from '../user/entities/user.entity'
import { SubmitAssessmentDto, UpdateQuestionAssessmentDto } from './dto'

/**
 * 认知边界评估服务
 * 处理用户问题评估的存储和查询
 */
@Injectable()
export class CognitiveBoundaryService {
  private readonly logger = new Logger(CognitiveBoundaryService.name)

  /**
   * 维度名称映射
   */
  private readonly dimensionNames: Record<string, string> = {
    location: '地点选择',
    selfPositioning: '自我定位',
    developmentDirection: '发展方向',
    industries: '行业领域',
    platformTypes: '平台性质',
    companyScales: '企业规模',
    companyCulture: '企业文化',
    leadershipStyle: '领导风格',
    trainingPrograms: '培训项目',
    overtimePreference: '加班偏好',
    holidayPolicy: '假期天数',
    medicalBenefits: '医疗保障',
    maternityBenefits: '生育福利',
  }

  constructor(
    @InjectRepository(CognitiveBoundaryAssessment)
    private assessmentRepository: Repository<CognitiveBoundaryAssessment>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * 从 questionId 中解析维度和子类别
   * 格式: dimensionKey-subCategory-number 或 dimensionKey-number
   */
  private parseQuestionId(questionId: string): {
    dimensionKey: string
    subCategory: string | null
    questionNumber: number
  } {
    const parts = questionId.split('-')

    if (parts.length === 2) {
      // 格式: dimensionKey-number (无子类别)
      return {
        dimensionKey: parts[0],
        subCategory: null,
        questionNumber: parseInt(parts[1], 10),
      }
    }

    if (parts.length >= 3) {
      // 格式: dimensionKey-subCategory-number 或更多部分
      // 最后一个部分是数字，倒数第二个是子类别
      const questionNumber = parseInt(parts[parts.length - 1], 10)
      const subCategory = parts[parts.length - 2]
      const dimensionKey = parts[0]

      return {
        dimensionKey,
        subCategory,
        questionNumber,
      }
    }

    // 兜底处理
    return {
      dimensionKey: questionId,
      subCategory: null,
      questionNumber: 0,
    }
  }

  /**
   * 计算维度下的子类别统计
   */
  private calculateSubCategoryStats(
    assessments: QuestionAssessmentData[],
    dimensionKey: string,
  ): SubCategoryStats[] {
    const subCategoryMap = new Map<string, QuestionAssessmentData[]>()

    for (const assessment of assessments) {
      // 使用显式设置的 subCategory，否则从 questionId 解析
      const subCategory = assessment.subCategory || this.parseQuestionId(assessment.questionId).subCategory

      if (subCategory) {
        if (!subCategoryMap.has(subCategory)) {
          subCategoryMap.set(subCategory, [])
        }
        subCategoryMap.get(subCategory)!.push(assessment)
      }
    }

    // 如果没有子类别，返回空数组
    if (subCategoryMap.size === 0) {
      return []
    }

    // 计算每个子类别的统计信息
    const stats: SubCategoryStats[] = []

    for (const [subCategory, categoryAssessments] of subCategoryMap) {
      const avgScore = categoryAssessments.reduce((sum, a) => sum + a.level, 0) / categoryAssessments.length

      stats.push({
        subCategory,
        subCategoryName: this.getSubCategoryDisplayName(dimensionKey, subCategory),
        questionCount: categoryAssessments.length,
        averageScore: Math.round(avgScore * 20), // 转换为0-100分
      })
    }

    // 按平均分降序排序
    return stats.sort((a, b) => b.averageScore - a.averageScore)
  }

  /**
   * 获取子类别的显示名称
   */
  private getSubCategoryDisplayName(dimensionKey: string, subCategory: string): string {
    // 可扩展的子类别名称映射
    const subCategoryNames: Record<string, Record<string, string>> = {
      location: {
        Beijing: '北京',
        Shanghai: '上海',
        Shenzhen: '深圳',
        Hangzhou: '杭州',
        Chengdu: '成都',
        Guangzhou: '广州',
      },
      industries: {
        Internet: '互联网',
        Finance: '金融',
        Consulting: '咨询',
        Manufacturing: '制造业',
        Education: '教育',
        Healthcare: '医疗健康',
      },
      // 其他维度的子类别可以按需添加
    }

    return subCategoryNames[dimensionKey]?.[subCategory] || subCategory
  }

  /**
   * 获取用户当前的认知边界评估
   */
  async getAssessment(userId: string) {
    // 验证用户是否存在
    const user = await this.userRepository.findOne({ where: { id: userId } })
    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: '用户不存在',
      })
    }

    // 查找最新的评估记录
    const assessment = await this.assessmentRepository.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    })

    return {
      success: true,
      data: assessment || null,
    }
  }

  /**
   * 提交评估
   */
  async submitAssessment(userId: string, dto: SubmitAssessmentDto) {
    // 验证用户是否存在
    const user = await this.userRepository.findOne({ where: { id: userId } })
    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: '用户不存在',
      })
    }

    // 按维度分组评估
    const dimensionMap = new Map<string, QuestionAssessmentData[]>()

    for (const assessment of dto.assessments) {
      const { dimensionKey, subCategory } = this.parseQuestionId(assessment.questionId)

      if (!dimensionMap.has(dimensionKey)) {
        dimensionMap.set(dimensionKey, [])
      }

      const assessmentData: QuestionAssessmentData = {
        questionId: assessment.questionId,
        level: assessment.level,
        assessedAt: assessment.assessedAt || new Date().toISOString(),
        // 使用 DTO 中提供的 subCategory，否则使用解析得到的
        subCategory: assessment.subCategory || subCategory || undefined,
        notes: assessment.notes,
        stage: assessment.stage,
      }

      dimensionMap.get(dimensionKey)!.push(assessmentData)
    }

    // 构建维度数据
    const dimensions: DimensionAssessmentData[] = []

    for (const [dimensionKey, assessments] of dimensionMap) {
      const avgScore = assessments.reduce((sum, a) => sum + a.level, 0) / assessments.length
      const subCategories = this.calculateSubCategoryStats(assessments, dimensionKey)

      dimensions.push({
        dimensionKey,
        dimensionName: this.dimensionNames[dimensionKey] || dimensionKey,
        assessments,
        averageScore: Math.round(avgScore * 20), // 转换为0-100分
        subCategories,
      })
    }

    // 计算总问题数和已评估数
    const totalQuestions = 65 // 13维度 × 5问题
    const assessedQuestions = dto.assessments.length

    // 创建或更新评估记录
    let assessment = await this.assessmentRepository.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    })

    if (assessment) {
      // 更新现有记录
      assessment.dimensions = dimensions
      assessment.totalQuestions = totalQuestions
      assessment.assessedQuestions = assessedQuestions
      if (assessedQuestions >= totalQuestions) {
        assessment.completedAt = new Date()
      }
    } else {
      // 创建新记录
      assessment = this.assessmentRepository.create({
        userId,
        dimensions,
        totalQuestions,
        assessedQuestions,
        completedAt: assessedQuestions >= totalQuestions ? new Date() : null,
      })
    }

    await this.assessmentRepository.save(assessment)
    this.logger.log(`Submitted assessment for user ${userId}: ${assessedQuestions}/${totalQuestions} questions`)

    return {
      success: true,
      data: assessment,
    }
  }

  /**
   * 更新单个问题的评估
   */
  async updateQuestionAssessment(userId: string, questionId: string, dto: UpdateQuestionAssessmentDto) {
    // 验证用户是否存在
    const user = await this.userRepository.findOne({ where: { id: userId } })
    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: '用户不存在',
      })
    }

    // 查找现有评估
    let assessment = await this.assessmentRepository.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    })

    if (!assessment) {
      // 创建新的评估记录
      assessment = this.assessmentRepository.create({
        userId,
        dimensions: [],
        totalQuestions: 65,
        assessedQuestions: 0,
      })
    }

    // 解析问题ID
    const { dimensionKey, subCategory } = this.parseQuestionId(questionId)

    // 更新或添加问题评估
    let dimension = assessment.dimensions.find((d) => d.dimensionKey === dimensionKey)

    if (!dimension) {
      dimension = {
        dimensionKey,
        dimensionName: this.dimensionNames[dimensionKey] || dimensionKey,
        assessments: [],
        averageScore: 0,
        subCategories: [],
      }
      assessment.dimensions.push(dimension)
    }

    // 查找并更新问题评估
    const existingIndex = dimension.assessments.findIndex((a) => a.questionId === questionId)
    const newAssessment: QuestionAssessmentData = {
      questionId,
      level: dto.level,
      assessedAt: new Date().toISOString(),
      // 使用 DTO 中提供的值，否则使用解析得到的子类别
      subCategory: dto.subCategory || subCategory || undefined,
      notes: dto.notes,
      stage: dto.stage,
    }

    if (existingIndex >= 0) {
      dimension.assessments[existingIndex] = newAssessment
    } else {
      dimension.assessments.push(newAssessment)
      assessment.assessedQuestions += 1
    }

    // 重新计算平均分
    dimension.averageScore = Math.round(
      (dimension.assessments.reduce((sum, a) => sum + a.level, 0) / dimension.assessments.length) * 20,
    )

    // 重新计算子类别统计
    dimension.subCategories = this.calculateSubCategoryStats(dimension.assessments, dimensionKey)

    // 检查是否完成
    if (assessment.assessedQuestions >= assessment.totalQuestions && !assessment.completedAt) {
      assessment.completedAt = new Date()
    }

    await this.assessmentRepository.save(assessment)

    return {
      success: true,
      data: assessment,
    }
  }

  /**
   * 获取评估历史
   */
  async getAssessmentHistory(userId: string) {
    const assessments = await this.assessmentRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 10,
    })

    return {
      success: true,
      data: assessments,
    }
  }

  /**
   * 获取用户按子类别分组的评估统计
   */
  async getSubCategoryStats(userId: string, dimensionKey: string) {
    const assessment = await this.assessmentRepository.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    })

    if (!assessment) {
      return {
        success: true,
        data: null,
      }
    }

    const dimension = assessment.dimensions.find((d) => d.dimensionKey === dimensionKey)

    if (!dimension) {
      return {
        success: true,
        data: null,
      }
    }

    return {
      success: true,
      data: {
        dimensionKey: dimension.dimensionKey,
        dimensionName: dimension.dimensionName,
        averageScore: dimension.averageScore,
        subCategories: dimension.subCategories || [],
      },
    }
  }

  /**
   * 获取用户特定阶段的评估数据
   */
  async getAssessmentsByStage(userId: string, stage: AssessmentStage) {
    const assessment = await this.assessmentRepository.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    })

    if (!assessment) {
      return {
        success: true,
        data: null,
      }
    }

    // 过滤出特定阶段的评估
    const filteredDimensions: DimensionAssessmentData[] = assessment.dimensions.map((dimension) => {
      const filteredAssessments = dimension.assessments.filter((a) => a.stage === stage)

      return {
        dimensionKey: dimension.dimensionKey,
        dimensionName: dimension.dimensionName,
        assessments: filteredAssessments,
        averageScore:
          filteredAssessments.length > 0
            ? Math.round((filteredAssessments.reduce((sum, a) => sum + a.level, 0) / filteredAssessments.length) * 20)
            : 0,
        subCategories: this.calculateSubCategoryStats(filteredAssessments, dimension.dimensionKey),
      }
    })

    return {
      success: true,
      data: {
        ...assessment,
        dimensions: filteredDimensions,
      },
    }
  }
}