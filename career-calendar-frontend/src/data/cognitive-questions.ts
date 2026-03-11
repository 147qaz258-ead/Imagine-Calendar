/**
 * 摸索认知边界问题清单
 * 13维度 × 5问题
 * 内容来自日历项目demo想法.md，不可修改
 *
 * 新增：支持按偏好选项动态加载问题
 */

import type { UserPreferences } from '../modules/profile/types'
import { LOCATION_SPECIFIC_QUESTIONS, getLocationQuestions } from './location-questions'
import { INDUSTRY_SPECIFIC_QUESTIONS, getIndustryQuestions } from './industry-questions'

// 问题等级类型
export type QuestionLevel = 1 | 2 | 3 | 4 | 5

// 问题接口（原有接口，保持向后兼容）
export interface Question {
  id: string
  dimension: string
  dimensionKey: string
  questionNumber: number
  questionText: string
  subCategory?: string // 子分类（如商人、创业者等）
}

/**
 * 认知问题接口（新版，支持动态加载）
 * 用于根据用户偏好动态返回相关问题
 */
export interface CognitiveQuestion {
  /** 问题唯一标识 */
  readonly id: string
  /** 维度键（对应 UserPreferences 的字段名） */
  readonly dimensionKey: string
  /** 维度名称（中文） */
  readonly dimensionName: string
  /** 子类别：如"北京"、"互联网"、"商人"等 */
  readonly subCategory?: string
  /** 问题文本 */
  readonly question: string
  /** 问题难度等级 1-5 */
  readonly level: QuestionLevel
  /** 关联的偏好选项（用于动态匹配） */
  readonly relatedOptions?: readonly string[]
}

// 评估等级描述
export const ASSESSMENT_LEVELS: Record<QuestionLevel, { label: string; description: string }> = {
  1: {
    label: '完全不知道',
    description: '完全不知道/没听过',
  },
  2: {
    label: '听说过不确定',
    description: '是的，我听说过并不确定',
  },
  3: {
    label: '做过信息搜索',
    description: '是的，我做过一点基于客观事实的信息搜索',
  },
  4: {
    label: '知道基本事实',
    description: '是的，我很确定我知道基本的客观事实但并不深入',
  },
  5: {
    label: '深入了解',
    description: '我很熟悉/深入了解过/身边有切实的信息渠道',
  },
}

// 13维度定义
export const DIMENSIONS = [
  { key: 'locations', name: '地点选择', description: '中国城市列表' },
  { key: 'selfPositioning', name: '自我定位', description: '商人/创业者/职业经理人' },
  { key: 'developmentDirection', name: '发展方向', description: '公共部门/私营部门/公私合营部门' },
  { key: 'industries', name: '行业领域', description: '40+行业' },
  { key: 'platformTypes', name: '平台性质', description: '国内/外资/合资' },
  { key: 'companyScales', name: '企业规模', description: '财富500强到百万规模' },
  { key: 'companyCulture', name: '企业文化', description: '扁平化/垂直化' },
  { key: 'leadershipStyle', name: '领导风格', description: '专制程度/民主程度' },
  { key: 'trainingPrograms', name: '培训项目', description: '管理培训/轮岗/内部创业等' },
  { key: 'overtimePreference', name: '加班偏好', description: '964/965/855/996/995/7*24' },
  { key: 'holidayPolicy', name: '假期天数', description: '5天-60天/年' },
  { key: 'medicalBenefits', name: '医疗保障', description: '普通/高端/定制' },
  { key: 'maternityBenefits', name: '生育福利', description: '生育检查相关' },
] as const

// 维度键类型
export type DimensionKey = typeof DIMENSIONS[number]['key']

// 5个标准问题模板
export const STANDARD_QUESTIONS = [
  '是什么？',
  '意味着什么？',
  '对你感兴趣的领域产生什么样的影响？',
  '你的选择会多大程度决定你更改你的兴趣领域？',
  '这个选择对人才市场会有什么影响？',
]


/**
 * 通用问题（不关联特定偏好选项）
 * 当用户没有选择特定选项时显示
 */
const GENERIC_QUESTIONS: readonly CognitiveQuestion[] = [
  // 地点选择通用问题
  {
    id: 'location-generic-1',
    dimensionKey: 'locations',
    dimensionName: '地点选择',
    question: '你选择的城市在中国是什么定位？有哪些支柱产业？为什么这些产业是支柱产业？有什么样的政策倾向？代表了什么样的职业环境和发展机会？',
    level: 1,
  },
  {
    id: 'location-generic-2',
    dimensionKey: 'locations',
    dimensionName: '地点选择',
    question: '这些支柱产业意味着什么样的政策倾向？选择特定的城市工作意味着你将面临哪些特定的生活成本、工作节奏和职业机遇？',
    level: 2,
  },
  // 行业领域通用问题
  {
    id: 'industries-generic-1',
    dimensionKey: 'industries',
    dimensionName: '行业领域',
    question: '你选择的是哪个行业？这个行业主要在中国的哪几个地方有政策扶持？这个行业有什么样的宏观政策倾向？这个行业是不是属于你所选择的城市的支柱产业？',
    level: 1,
  },
  {
    id: 'industries-generic-2',
    dimensionKey: 'industries',
    dimensionName: '行业领域',
    question: '选择不同的行业意味着什么？它是一片蓝海还是红海？你对行业发展的前景和可能带来的职业机会有何期待？',
    level: 2,
  },
  // 自我定位通用问题
  {
    id: 'selfPositioning-generic-1',
    dimensionKey: 'selfPositioning',
    dimensionName: '自我定位',
    question: '你对自己的职业定位是什么？商人、创业者、还是职业经理人？你知道这三种角色的核心区别吗？',
    level: 1,
  },
]

/**
 * 根据用户偏好动态获取相关问题
 *
 * @param preferences 用户偏好对象
 * @param options 配置选项
 * @returns 匹配用户偏好的问题列表
 *
 * @example
 * const questions = getDynamicQuestions({
 *   locations: ['北京', '上海'],
 *   industries: ['互联网', '金融']
 * })
 * // 返回北京、上海、互联网、金融相关的特定问题
 */
export function getDynamicQuestions(
  preferences: UserPreferences,
  options?: {
    /** 是否包含通用问题（默认 true） */
    includeGeneric?: boolean
    /** 每个维度的最大问题数（默认 5） */
    maxQuestionsPerDimension?: number
    /** 最大总问题数（默认 50） */
    maxTotalQuestions?: number
  }
): CognitiveQuestion[] {
  const {
    includeGeneric = true,
    maxQuestionsPerDimension = 5,
    maxTotalQuestions = 50,
  } = options ?? {}

  const result: CognitiveQuestion[] = []
  const addedQuestionIds = new Set<string>()

  // 辅助函数：添加问题（去重）
  const addQuestions = (questions: readonly CognitiveQuestion[]): void => {
    for (const q of questions) {
      if (!addedQuestionIds.has(q.id) && result.length < maxTotalQuestions) {
        addedQuestionIds.add(q.id)
        result.push(q)
      }
    }
  }

  // 辅助函数：按维度计数
  const getDimensionCount = (dimensionKey: string): number => {
    return result.filter(q => q.dimensionKey === dimensionKey).length
  }

  // 1. 根据地点偏好加载特定问题
  if (preferences.locations && preferences.locations.length > 0) {
    for (const location of preferences.locations) {
      if (getDimensionCount('locations') >= maxQuestionsPerDimension) break
      const locationQuestions = getLocationQuestions(location)
      const availableSlots = maxQuestionsPerDimension - getDimensionCount('locations')
      addQuestions(locationQuestions.slice(0, availableSlots))
    }
  }

  // 2. 根据行业偏好加载特定问题
  if (preferences.industries && preferences.industries.length > 0) {
    for (const industry of preferences.industries) {
      if (getDimensionCount('industries') >= maxQuestionsPerDimension) break
      const industryQuestions = getIndustryQuestions(industry)
      const availableSlots = maxQuestionsPerDimension - getDimensionCount('industries')
      addQuestions(industryQuestions.slice(0, availableSlots))
    }
  }

  // 3. 根据自我定位偏好加载特定问题（使用原有的 QUESTIONS 数据）
  if (preferences.selfPositioning && preferences.selfPositioning.length > 0) {
    for (const positioning of preferences.selfPositioning) {
      if (getDimensionCount('selfPositioning') >= maxQuestionsPerDimension) break

      // 从原有问题中筛选
      const positioningQuestions = QUESTIONS.filter(
        q => q.dimensionKey === 'selfPositioning' && q.subCategory === positioning
      )

      const convertedQuestions: CognitiveQuestion[] = positioningQuestions
        .slice(0, maxQuestionsPerDimension - getDimensionCount('selfPositioning'))
        .map(q => ({
          id: q.id,
          dimensionKey: q.dimensionKey,
          dimensionName: q.dimension,
          subCategory: q.subCategory,
          question: q.questionText,
          level: (q.questionNumber <= 2 ? 1 : q.questionNumber <= 4 ? 3 : 5) as QuestionLevel,
          relatedOptions: [positioning],
        }))

      addQuestions(convertedQuestions)
    }
  }

  // 4. 根据发展方向偏好加载特定问题
  if (preferences.developmentDirection && preferences.developmentDirection.length > 0) {
    for (const direction of preferences.developmentDirection) {
      if (getDimensionCount('developmentDirection') >= maxQuestionsPerDimension) break

      const directionQuestions = QUESTIONS.filter(
        q => q.dimensionKey === 'developmentDirection' && q.subCategory === direction
      )

      const convertedQuestions: CognitiveQuestion[] = directionQuestions
        .slice(0, maxQuestionsPerDimension - getDimensionCount('developmentDirection'))
        .map(q => ({
          id: q.id,
          dimensionKey: q.dimensionKey,
          dimensionName: q.dimension,
          subCategory: q.subCategory,
          question: q.questionText,
          level: (q.questionNumber <= 2 ? 1 : q.questionNumber <= 4 ? 3 : 5) as QuestionLevel,
          relatedOptions: [direction],
        }))

      addQuestions(convertedQuestions)
    }
  }

  // 5. 根据培训项目偏好加载特定问题
  if (preferences.trainingPrograms && preferences.trainingPrograms.length > 0) {
    for (const program of preferences.trainingPrograms) {
      if (getDimensionCount('trainingPrograms') >= maxQuestionsPerDimension) break

      const programQuestions = QUESTIONS.filter(
        q => q.dimensionKey === 'trainingPrograms' && q.subCategory === program
      )

      const convertedQuestions: CognitiveQuestion[] = programQuestions
        .slice(0, maxQuestionsPerDimension - getDimensionCount('trainingPrograms'))
        .map(q => ({
          id: q.id,
          dimensionKey: q.dimensionKey,
          dimensionName: q.dimension,
          subCategory: q.subCategory,
          question: q.questionText,
          level: (q.questionNumber <= 2 ? 1 : q.questionNumber <= 4 ? 3 : 5) as QuestionLevel,
          relatedOptions: [program],
        }))

      addQuestions(convertedQuestions)
    }
  }

  // 6. 添加通用问题（如果启用且还有空间）
  if (includeGeneric) {
    const genericQuestionsToAdd = GENERIC_QUESTIONS.filter(
      gq => !addedQuestionIds.has(gq.id) && getDimensionCount(gq.dimensionKey) < maxQuestionsPerDimension
    )
    addQuestions(genericQuestionsToAdd)
  }

  return result
}

/**
 * 获取指定维度的问题（支持动态和静态两种模式）
 *
 * @param dimensionKey 维度键
 * @param preferences 可选的用户偏好，如果提供则返回动态问题
 * @returns 问题列表
 */
export function getQuestionsForDimension(
  dimensionKey: DimensionKey,
  preferences?: UserPreferences
): CognitiveQuestion[] {
  if (!preferences) {
    // 静态模式：返回通用问题
    return GENERIC_QUESTIONS.filter(q => q.dimensionKey === dimensionKey)
  }

  // 动态模式：根据偏好过滤
  const dynamicQuestions = getDynamicQuestions(preferences, {
    includeGeneric: true,
    maxQuestionsPerDimension: 10,
  })

  return dynamicQuestions.filter(q => q.dimensionKey === dimensionKey)
}

/**
 * 获取问题统计信息
 */
export function getQuestionStats(preferences?: UserPreferences): {
  totalQuestions: number
  byDimension: Record<string, number>
  hasDynamicQuestions: boolean
} {
  const questions = preferences
    ? getDynamicQuestions(preferences)
    : GENERIC_QUESTIONS

  const byDimension: Record<string, number> = {}

  for (const q of questions) {
    byDimension[q.dimensionKey] = (byDimension[q.dimensionKey] ?? 0) + 1
  }

  return {
    totalQuestions: questions.length,
    byDimension,
    hasDynamicQuestions: questions.some(q => q.relatedOptions && q.relatedOptions.length > 0),
  }
}

// ========== 以下为原有数据（保持向后兼容） ==========

// 完整问题清单 - 内容来自日历项目demo想法.md第76-338行
export const QUESTIONS: Question[] = [
  // ========== 1. 地点选择 ==========
  {
    id: 'location-1',
    dimension: '地点选择',
    dimensionKey: 'location',
    questionNumber: 1,
    questionText: '你选择的城市在中国是什么定位？有哪些支柱产业？为什么这些产业是支柱产业？有什么样的政策倾向？代表了什么样的职业环境和发展机会？是经济发达的地区，还是文化氛围浓厚的城市？',
  },
  {
    id: 'location-2',
    dimension: '地点选择',
    dimensionKey: 'location',
    questionNumber: 2,
    questionText: '这些支柱产业意味着什么样的政策倾向？选择特定的城市工作意味着你将面临哪些特定的生活成本、工作节奏和职业机遇？',
  },
  {
    id: 'location-3',
    dimension: '地点选择',
    dimensionKey: 'location',
    questionNumber: 3,
    questionText: '你选择的城市如何影响你感兴趣的行业和领域？比如，某些行业是否在某些城市更加集中？对市场趋势有什么样的影响？',
  },
  {
    id: 'location-4',
    dimension: '地点选择',
    dimensionKey: 'location',
    questionNumber: 4,
    questionText: '选择城市的同时，是否会改变你对行业或职业方向的兴趣？例如，大城市可能会带来更多的科技行业机会，农村地区可能更倾向于农业或基础设施项目。',
  },
  {
    id: 'location-5',
    dimension: '地点选择',
    dimensionKey: 'location',
    questionNumber: 5,
    questionText: '在你选择的城市，人口组成结构你清楚吗？人才竞争状况如何？这些行业或者支柱产业或者政策倾向对人才流动有什么样的影响？你是否知道你在选择的城市的人才市场的定位和竞争力？这会影响你找到理想工作的位置、薪资水平和晋升机会？',
  },

  // ========== 2. 自我定位 - 商人 ==========
  {
    id: 'selfPositioning-merchant-1',
    dimension: '自我定位',
    dimensionKey: 'selfPositioning',
    questionNumber: 1,
    subCategory: '商人',
    questionText: '成为商人意味着你将承担企业经营、市场拓展和财务管理等职责。你怎么看待商人的角色定位？',
  },
  {
    id: 'selfPositioning-merchant-2',
    dimension: '自我定位',
    dimensionKey: 'selfPositioning',
    questionNumber: 2,
    subCategory: '商人',
    questionText: '做一个商人意味着你将更多地注重商业运作、风险管理和机会抓取。你准备好承担这些责任吗？',
  },
  {
    id: 'selfPositioning-merchant-3',
    dimension: '自我定位',
    dimensionKey: 'selfPositioning',
    questionNumber: 3,
    subCategory: '商人',
    questionText: '作为商人，你选择的行业是否有足够的市场空间和竞争潜力？你认为哪个行业更适合你的商业模式？',
  },
  {
    id: 'selfPositioning-merchant-4',
    dimension: '自我定位',
    dimensionKey: 'selfPositioning',
    questionNumber: 4,
    subCategory: '商人',
    questionText: '成为商人后，你是否更容易偏向企业管理而非技术或产品开发？',
  },
  {
    id: 'selfPositioning-merchant-5',
    dimension: '自我定位',
    dimensionKey: 'selfPositioning',
    questionNumber: 5,
    subCategory: '商人',
    questionText: '成为商人后，你是否会面临更多的挑战，如资金筹集、市场占有率和团队管理？这个选择会让你在市场上更具竞争力吗？',
  },

  // ========== 2. 自我定位 - 创业者 ==========
  {
    id: 'selfPositioning-entrepreneur-1',
    dimension: '自我定位',
    dimensionKey: 'selfPositioning',
    questionNumber: 1,
    subCategory: '创业者',
    questionText: '你将创造一个新的企业或产品，承担从零开始的各种挑战？你知道商人和企业家的区别吗？你如何定义创业成功和失败？',
  },
  {
    id: 'selfPositioning-entrepreneur-2',
    dimension: '自我定位',
    dimensionKey: 'selfPositioning',
    questionNumber: 2,
    subCategory: '创业者',
    questionText: '作为创业者，意味着你可能需要不断地调整业务模式、产品和市场策略。你如何看待这种灵活性和不确定性？你理解你所掌握的权力、责任、和利益都是什么吗？你了解创业失败的概率远远大于成功的概率吗？你了解大多数创业者最终成为企业家的屈指可数吗？你了解你创业成功意味着什么吗？你了解创业失败又意味着什么吗？你了解如果想要成为一个企业家，需要牺牲什么吗？你感兴趣的领域中充斥着创业者或者只有零星可数的创业者，你明白这意味着什么吗？',
  },
  {
    id: 'selfPositioning-entrepreneur-3',
    dimension: '自我定位',
    dimensionKey: 'selfPositioning',
    questionNumber: 3,
    subCategory: '创业者',
    questionText: '创业需要深入了解市场需求和用户痛点，你感兴趣的领域是否有足够的市场潜力？你如何发现行业中的创新机会？你感兴趣的领域中充斥着创业者，你理解着会产生什么样的影响吗？',
  },
  {
    id: 'selfPositioning-entrepreneur-4',
    dimension: '自我定位',
    dimensionKey: 'selfPositioning',
    questionNumber: 4,
    subCategory: '创业者',
    questionText: '创业可能会迫使你专注于某个特定的行业或领域，你是否准备好将你的兴趣集中在一个项目上，并放弃其他领域？',
  },
  {
    id: 'selfPositioning-entrepreneur-5',
    dimension: '自我定位',
    dimensionKey: 'selfPositioning',
    questionNumber: 5,
    subCategory: '创业者',
    questionText: '你了解在人才市场上，创业者如何被定位吗？这样的选择能帮助你吸引合适的人才，还是可能面临更多的竞争和不确定性？',
  },

  // ========== 2. 自我定位 - 职业经理人 ==========
  {
    id: 'selfPositioning-manager-1',
    dimension: '自我定位',
    dimensionKey: 'selfPositioning',
    questionNumber: 1,
    subCategory: '职业经理人',
    questionText: '职业经理人是什么？有几类？有几种职能几类岗位？每种职能或每类岗位的人才画像你清楚吗？你觉得自己是否适合这样的角色？职业经理人的生活方式是什么样的，财富阶级是什么水平，社会地位在中国处于什么位置？',
  },
  {
    id: 'selfPositioning-manager-2',
    dimension: '自我定位',
    dimensionKey: 'selfPositioning',
    questionNumber: 2,
    subCategory: '职业经理人',
    questionText: '你知道在管理层工作意味着你需要决策、激励团队并应对企业运营中的挑战吗？做个人贡献者又意味着什么？未来ai工具的出现对这两种角色意味着什么？你认为这是否符合你的职业期望？你理解职业经理人的角色直接决定了你未来的生活方式、财富阶级以及社会地位的天花板吗？',
  },
  {
    id: 'selfPositioning-manager-3',
    dimension: '自我定位',
    dimensionKey: 'selfPositioning',
    questionNumber: 3,
    subCategory: '职业经理人',
    questionText: '作为职业经理人，你的兴趣领域是否有足够的发挥空间？你是否能够同时关注多个行业方向？',
  },
  {
    id: 'selfPositioning-manager-4',
    dimension: '自我定位',
    dimensionKey: 'selfPositioning',
    questionNumber: 4,
    subCategory: '职业经理人',
    questionText: '作为职业经理人，你是否更倾向于转向某些稳定的行业，如金融、科技等，而忽略其他更具潜力或创新性的行业？你感兴趣的领域是否能够让职业经理人',
  },
  {
    id: 'selfPositioning-manager-5',
    dimension: '自我定位',
    dimensionKey: 'selfPositioning',
    questionNumber: 5,
    subCategory: '职业经理人',
    questionText: '在人才市场上，作为职业经理人，你是否了解在你感兴趣的领域的人才趋势？核心的竞争力？是否需要强制性的高强度专业知识的学习？需要培养更强的管理技能和领导力？这是否会让你在人才市场中更具吸引力，或者面临更多的职业挑战？你了解作为管理方向发展的职业经理人在不同行业的人才市场上的流通程度吗？',
  },

  // ========== 3. 发展方向 - 公共部门 ==========
  {
    id: 'developmentDirection-public-1',
    dimension: '发展方向',
    dimensionKey: 'developmentDirection',
    questionNumber: 1,
    subCategory: '公共部门',
    questionText: '选择公共部门意味着你将服务于政府或非政府组织，推动社会和公共政策的改善。这与你的职业目标匹配吗？公共领域的职业方向有哪些？你了解中国权力机构的运作方式吗？你了解政治领域目前的生态是什么样吗？你有政治理想和政治目标吗？你清楚官员和官吏的区别吗？你了解目前中国的中央政府与地方政府的特点和区别吗？你了解中国如何管理非政府组织吗？你了解非政府组织包括了非盈利机构以及社会企业吗？你了解它们的区别吗？你了解学术领域在中国属于哪个领域吗？你了解国企、央企、事业单位以及地方政府控股企业的区别吗？它们的角色、定位、核心竞争力是什么？你了解国央企、事业单位有着不同的运作方式，比如市场化运作、政治性运作、以及平衡以上两种方式？',
  },
  {
    id: 'developmentDirection-public-2',
    dimension: '发展方向',
    dimensionKey: 'developmentDirection',
    questionNumber: 2,
    subCategory: '公共部门',
    questionText: '从事公共部门工作通常伴随着更强的社会责任感和公益性，你知道这对你的思维方式、沟通方式、做事逻辑意味着什么吗？你了解在公共领域不同类型的组织对生活方式的影响吗？',
  },
  {
    id: 'developmentDirection-public-3',
    dimension: '发展方向',
    dimensionKey: 'developmentDirection',
    questionNumber: 3,
    subCategory: '公共部门',
    questionText: '你是否会在公共部门中找到与个人兴趣和社会影响相契合的领域？这个方向是否能让你专注于服务社会而非追求利润？',
  },
  {
    id: 'developmentDirection-public-4',
    dimension: '发展方向',
    dimensionKey: 'developmentDirection',
    questionNumber: 4,
    subCategory: '公共部门',
    questionText: '从事公共部门工作可能会让你更关注社会政策和公共事务，而非某些市场导向的行业。你准备好将职业兴趣转向这些领域吗？',
  },
  {
    id: 'developmentDirection-public-5',
    dimension: '发展方向',
    dimensionKey: 'developmentDirection',
    questionNumber: 5,
    subCategory: '公共部门',
    questionText: '你认为这种选择会为你带来长期稳定的职业发展，还是需要面对一些挑战？你是否了解离开公共领域是否还有可能在其他领域找到你的位置？你是否清楚未来有一天离开公共领域进入其他领域，你在人才市场的竞争力和可能性？你了解政府部门的工作人员的上升通道吗？你了解国企央企事业单位的上升空间目前是什么样的吗？你清楚国企央企事业单位的文化、需要的人才画像吗？',
  },

  // ========== 3. 发展方向 - 私营部门 ==========
  {
    id: 'developmentDirection-private-1',
    dimension: '发展方向',
    dimensionKey: 'developmentDirection',
    questionNumber: 1,
    subCategory: '私营部门',
    questionText: '在私营部门工作意味着你将直接参与市场竞争和商业运营，通常会有更多的晋升机会和薪资回报。你对商业世界如何运作了解吗？你知道商业世界的本质是什么吗？你熟悉商业世界的用语吗？你清楚商业模式是什么意思吗？你知道sales和revenue分别代表什么吗？你看得懂财务报告吗？你对自己的定位是商人、企业家还是一个职业经理人？你是选择民营企业、自我创业、还是高度市场化的国央企？民营企业占到中国gdp的多少？民营企业有哪些类型？这些类型中有哪些有国家的政策倾向？',
  },
  {
    id: 'developmentDirection-private-2',
    dimension: '发展方向',
    dimensionKey: 'developmentDirection',
    questionNumber: 2,
    subCategory: '私营部门',
    questionText: '为什么有这些政策倾向？民营企业的特点你了解吗？这些特点意味着什么（比如民营企业更看重经济价值，因此意味着业绩压力）？你是否准备好迎接这种工作节奏和绩效压力？你清楚什么样的民营企业有什么样的工作节奏和具体什么程度的压力吗？你是否清楚这些不同程度的节奏、要求对你的生活意味着什么？',
  },
  {
    id: 'developmentDirection-private-3',
    dimension: '发展方向',
    dimensionKey: 'developmentDirection',
    questionNumber: 3,
    subCategory: '私营部门',
    questionText: '私营部门是否能为你感兴趣的领域提供足够的发展机会？你清楚民营企业的竞争激烈到什么程度吗？你能举出一个现实存在的客观的例子吗？你是否能在竞争激烈的环境中找到适合自己的职位？你了解你的兴趣在这样不同的环境中被如何影响吗（你喜欢酒，自然可以考虑酒水企业，然而你能接受工作时间频繁饮酒吗？）',
  },
  {
    id: 'developmentDirection-private-4',
    dimension: '发展方向',
    dimensionKey: 'developmentDirection',
    questionNumber: 4,
    subCategory: '私营部门',
    questionText: '在私营部门中工作，你可能会更多关注市场需求、客户需求和盈利模式，这是否会改变你对行业的兴趣？',
  },
  {
    id: 'developmentDirection-private-5',
    dimension: '发展方向',
    dimensionKey: 'developmentDirection',
    questionNumber: 5,
    subCategory: '私营部门',
    questionText: '在私营部门，人才市场的竞争通常较激烈，你是否有足够的能力脱颖而出？选择私营部门工作会影响你的职业成长速度吗？民营企业的人才市场中青睐什么样的人才？',
  },

  // ========== 3. 发展方向 - 公私合营 ==========
  {
    id: 'developmentDirection-mixed-1',
    dimension: '发展方向',
    dimensionKey: 'developmentDirection',
    questionNumber: 1,
    subCategory: '公私合营部门',
    questionText: '公私合营领域有哪些机构或企业？你了解为什么合营吗？你了解在你感兴趣的领域有哪些机构或企业？它们是依靠什么在市场上占有一席之地？',
  },
  {
    id: 'developmentDirection-mixed-2',
    dimension: '发展方向',
    dimensionKey: 'developmentDirection',
    questionNumber: 2,
    subCategory: '公私合营部门',
    questionText: '选择公私合营部门可能会给你带来独特的挑战，如文化融合、政策调整等。你准备好面对这些复杂性吗？',
  },
  {
    id: 'developmentDirection-mixed-3',
    dimension: '发展方向',
    dimensionKey: 'developmentDirection',
    questionNumber: 3,
    subCategory: '公私合营部门',
    questionText: '公私合营部门是否能为你感兴趣的行业提供更多的创新机会？你能否适应两种不同的工作文化？',
  },
  {
    id: 'developmentDirection-mixed-4',
    dimension: '发展方向',
    dimensionKey: 'developmentDirection',
    questionNumber: 4,
    subCategory: '公私合营部门',
    questionText: '进入公私合营部门可能会让你更关注政策制定和企业合作，这是否会改变你对某些行业的兴趣？',
  },
  {
    id: 'developmentDirection-mixed-5',
    dimension: '发展方向',
    dimensionKey: 'developmentDirection',
    questionNumber: 5,
    subCategory: '公私合营部门',
    questionText: '在公私合营部门，人才市场上你可能会遇到更复杂的招聘需求和更高的竞争要求。你准备好迎接这种挑战吗？你了解转换领域的路径吗？你考虑过转换领域会涉及到的考量因素吗？人才市场又是如何看待转换领域的人才？',
  },

  // ========== 4. 行业领域 ==========
  {
    id: 'industries-1',
    dimension: '行业领域',
    dimensionKey: 'industries',
    questionNumber: 1,
    questionText: '你选择的是哪个行业？这个行业主要在中国的哪几个地方有政策扶持？这个行业有什么样的宏观政策倾向？这个行业是不是属于你所选择的城市的支柱产业？这个行业的核心驱动力和未来10年的趋势是什么样的？这个行业里公共领域和私人领域分别是什么状态？具有影响力的几个机构或企业都是哪几家？',
  },
  {
    id: 'industries-2',
    dimension: '行业领域',
    dimensionKey: 'industries',
    questionNumber: 2,
    questionText: '选择不同的行业意味着什么？它是一片蓝海还是红海？你对行业发展的前景和可能带来的职业机会有何期待？这个行业意味着什么样的人才画像？你是否了解转换行业意味着什么？',
  },
  {
    id: 'industries-3',
    dimension: '行业领域',
    dimensionKey: 'industries',
    questionNumber: 3,
    questionText: '你所选择的行业可能涉及哪些创新、技术应用或市场需求？它如何与其他领域相交叉？在现有的ai技术冲击下，你选择的行业面临着哪些必然的改变？',
  },
  {
    id: 'industries-4',
    dimension: '行业领域',
    dimensionKey: 'industries',
    questionNumber: 4,
    questionText: '你选择的这个行业是你的兴趣使然还是出于对现实的妥协？这两者你清楚对你未来的发展有什么样的影响吗？如果是出于对现实的妥协，你是否认为你能从这个行业中学习到与你的兴趣相结合的东西？你能在多长时间里学到多少？你选择一个行业是否会让你逐渐进入一个更专注或更垂直的细分领域？',
  },
  {
    id: 'industries-5',
    dimension: '行业领域',
    dimensionKey: 'industries',
    questionNumber: 5,
    questionText: '你选择的行业目前所对应的人才市场是什么情况？行业的成熟度、竞争情况、人才供需如何影响你的职业发展？行业的前景如何影响你在未来的就业机会？在现有的AI冲击下，你选择的行业的人才市场对人才画像是否有明确的人机协同的要求？你是否了解这个行业的人才市场在你所选择的城市人才集中度以及竞争水平？你对于自己在你所选择的城市所选择的行业的人才市场有自我能力的定位吗？',
  },

  // ========== 5. 平台性质 ==========
  {
    id: 'platformTypes-1',
    dimension: '平台性质',
    dimensionKey: 'platformTypes',
    questionNumber: 1,
    questionText: '你选择的是哪种类型的平台？机构还是企业？学术领域、宗教领域、政治领域以及商业领域分别都有什么样的平台？国有企业、民营企业、外资企业，还是合资企业？你了解不同性质的平台的共性是什么吗？区别又是什么？看重什么（比如政治领域看重人才的政治资源、政治信仰、政治身份等，商业领域看重年轻人才的创造力、行动力、商业敏感度等等）？你了解不同性质的平台是如何产生的？存在的意义是什么？',
  },
  {
    id: 'platformTypes-2',
    dimension: '平台性质',
    dimensionKey: 'platformTypes',
    questionNumber: 2,
    questionText: '不同性质的平台有何文化差异、工作流程和发展机会？不同的文化差异由什么造成？不同的工作流程是否意味着不同的思维方式？这些对你想成为什么样的人意味着什么？这些对你想成为什么样的人才意味着什么？这些对你想掌握什么样的技能意味着什么？这些对你未来想要的生活方式意味着什么（比如国有企业或民营企业的假期通常无法与外资企业媲美）？不同性质的平台意味着不同的人才画像吗（比如外资企业和有海外业务的民营企业对英文普遍有较高的要求）？为什么有这样的差异？',
  },
  {
    id: 'platformTypes-3',
    dimension: '平台性质',
    dimensionKey: 'platformTypes',
    questionNumber: 3,
    questionText: '你理解不同性质的平台不同平台性质的公司会在发展方向和行业选择上有所不同。',
  },
  {
    id: 'platformTypes-4',
    dimension: '平台性质',
    dimensionKey: 'platformTypes',
    questionNumber: 4,
    questionText: '选择国内平台是否让你更倾向于一些政策导向和本地化需求较强的领域？外资平台可能让你更有机会接触到跨国运营和多元化发展。',
  },
  {
    id: 'platformTypes-5',
    dimension: '平台性质',
    dimensionKey: 'platformTypes',
    questionNumber: 5,
    questionText: '平台的性质如何影响公司对人才的招聘标准和待遇？它如何影响你在求职市场上的竞争力？你了解人才市场如何看待不同性质的平台的人才吗？你了解不同性质的平台如何培养年轻的人才吗？',
  },

  // ========== 6. 企业规模 ==========
  {
    id: 'companyScales-1',
    dimension: '企业规模',
    dimensionKey: 'companyScales',
    questionNumber: 1,
    questionText: '你选择加入的是大企业、小企业，还是中型企业？你了解以上规模的企业的区别是什么？你了解你所选择的行业的不同规模的企业都有哪几家？',
  },
  {
    id: 'companyScales-2',
    dimension: '企业规模',
    dimensionKey: 'companyScales',
    questionNumber: 2,
    questionText: '企业规模对你职业发展的影响是什么？大企业有更多的培训和晋升机会，小企业则可能让你承担更多职责？',
  },
  {
    id: 'companyScales-3',
    dimension: '企业规模',
    dimensionKey: 'companyScales',
    questionNumber: 3,
    questionText: '企业规模可能决定了你能接触到的项目类型、技术发展方向以及跨部门的合作机会？',
  },
  {
    id: 'companyScales-4',
    dimension: '企业规模',
    dimensionKey: 'companyScales',
    questionNumber: 4,
    questionText: '大企业可能会让你更倾向于专注于某个小领域的深耕，而小企业或创业公司则要求你接触更广泛的工作内容。你能分清楚平台价值以及个人价值吗？你能分清楚你的兴趣在你的选择的平台上会有多少发挥空间？',
  },
  {
    id: 'companyScales-5',
    dimension: '企业规模',
    dimensionKey: 'companyScales',
    questionNumber: 5,
    questionText: '不同规模的企业对年轻人才有着天差地别的画像，这是为什么？同一行业的不同规模的企业能否代表人才不同的专业水平？不同行业的不同规模的企业的人才是否可以互相流通？大企业的稳定性和发展机会如何吸引人才，小企业是否有更多灵活性和创造性机会？你了解从小企业向大企业的职业发展路径吗？你了解从大企业到小企业的职业发展路径吗？你了解人才市场如何看待一直在大企业的人才吗？大企业的人才有哪些短板？你了解人才市场如何看待一直在小企业的人才吗，又有哪些短板？你的自我定位又如何在不同行业的人才市场中体现？',
  },

  // ========== 7. 企业文化 ==========
  {
    id: 'companyCulture-1',
    dimension: '企业文化',
    dimensionKey: 'companyCulture',
    questionNumber: 1,
    questionText: '你更喜欢扁平化结构还是垂直化结构的企业文化？这种不同设定的背后的底层逻辑是什么？你是否了解决策人使用某种特定的模式想要解决的问题、谋求的利益是什么？',
  },
  {
    id: 'companyCulture-2',
    dimension: '企业文化',
    dimensionKey: 'companyCulture',
    questionNumber: 2,
    questionText: '扁平化结构鼓励创新和灵活性，垂直化结构更注重管理规范和发展路径？你清楚扁平化的结构适合什么样的平台？不同的结构会对你的思维方式和做事逻辑造成什么样的影响？',
  },
  {
    id: 'companyCulture-3',
    dimension: '企业文化',
    dimensionKey: 'companyCulture',
    questionNumber: 3,
    questionText: '在不同文化结构下，你如何在工作中定位自己的角色？你如何适应这种工作方式？你了解垂直化的结构给平台带来的价值吗？',
  },
  {
    id: 'companyCulture-4',
    dimension: '企业文化',
    dimensionKey: 'companyCulture',
    questionNumber: 4,
    questionText: '如果你选择了扁平化结构，你是否更倾向于创新型、创业型的工作内容？垂直化结构是否更适合那些喜欢稳定和明确发展路径的人？你的兴趣在哪一种结构可以得到更大的发挥空间？',
  },
  {
    id: 'companyCulture-5',
    dimension: '企业文化',
    dimensionKey: 'companyCulture',
    questionNumber: 5,
    questionText: '在不同的企业文化中，你的职业发展会如何受到影响？如何评估这些文化对你的适应性？',
  },

  // ========== 8. 领导风格 ==========
  {
    id: 'leadershipStyle-1',
    dimension: '领导风格',
    dimensionKey: 'leadershipStyle',
    questionNumber: 1,
    questionText: '你喜欢哪种领导风格？专制型还是民主型？你了解不同性质不同规模的平台的领导风格吗？你了解中国的人才市场如何定义领导风格吗？',
  },
  {
    id: 'leadershipStyle-2',
    dimension: '领导风格',
    dimensionKey: 'leadershipStyle',
    questionNumber: 2,
    questionText: '不同的领导风格对团队合作、工作氛围、决策效率等有何影响？',
  },
  {
    id: 'leadershipStyle-3',
    dimension: '领导风格',
    dimensionKey: 'leadershipStyle',
    questionNumber: 3,
    questionText: '领导风格可能会影响你所在领域的创新性、灵活性和风险承担吗？',
  },
  {
    id: 'leadershipStyle-4',
    dimension: '领导风格',
    dimensionKey: 'leadershipStyle',
    questionNumber: 4,
    questionText: '专制型领导可能更适合高效执行，而民主型领导则适合鼓励创新和多方合作。你是否更倾向于选择支持你个性发展的领域？',
  },
  {
    id: 'leadershipStyle-5',
    dimension: '领导风格',
    dimensionKey: 'leadershipStyle',
    questionNumber: 5,
    questionText: '不同的领导风格会影响你的职业发展方向，尤其是在多变的市场环境中，不同风格的公司对人才的吸引力如何？',
  },

  // ========== 9. 培训项目 - 管理培训 ==========
  {
    id: 'trainingPrograms-management-1',
    dimension: '培训项目',
    dimensionKey: 'trainingPrograms',
    questionNumber: 1,
    subCategory: '管理培训',
    questionText: '你是否考虑参加管理培训项目？管理培训通常包括领导力、决策制定、团队管理等核心技能的培养。许多大公司（如跨国企业）会定期开展管理培训，帮助员工从技术角色向管理角色过渡。',
  },
  {
    id: 'trainingPrograms-management-2',
    dimension: '培训项目',
    dimensionKey: 'trainingPrograms',
    questionNumber: 2,
    subCategory: '管理培训',
    questionText: '管理培训通常针对有潜力成为管理者的员工，它为你提供了在公司内部晋升的机会。大公司通常提供结构化的管理培训计划，帮助员工快速适应领导岗位的挑战，培养战略思维、团队合作和项目管理能力。',
  },
  {
    id: 'trainingPrograms-management-3',
    dimension: '培训项目',
    dimensionKey: 'trainingPrograms',
    questionNumber: 3,
    subCategory: '管理培训',
    questionText: '如果你有意进入管理岗位，管理培训是否能帮助你加速对领导力和团队管理的掌握？通过管理培训，你将获得关于如何处理复杂团队、制定决策和解决冲突等管理技能的知识，这对于你进入更高级的职位至关重要。',
  },
  {
    id: 'trainingPrograms-management-4',
    dimension: '培训项目',
    dimensionKey: 'trainingPrograms',
    questionNumber: 4,
    subCategory: '管理培训',
    questionText: '如果你选择参加管理培训，是否意味着你会从技术专才转向管理角色？管理培训通常是从技术型角色向管理型角色转型的桥梁，它可能会影响你选择更倾向于领导岗位而非专业技术岗位的职业路径。',
  },
  {
    id: 'trainingPrograms-management-5',
    dimension: '培训项目',
    dimensionKey: 'trainingPrograms',
    questionNumber: 5,
    subCategory: '管理培训',
    questionText: '企业通过管理培训培养未来的领导者，这类项目在人才市场上的认可度如何？企业在培养管理人才方面投入的资源通常会为他们的员工提供更广泛的发展机会。在人才市场中，管理培训背景的求职者通常受到大型企业的青睐。',
  },

  // ========== 9. 培训项目 - 轮岗 ==========
  {
    id: 'trainingPrograms-rotation-1',
    dimension: '培训项目',
    dimensionKey: 'trainingPrograms',
    questionNumber: 1,
    subCategory: '轮岗',
    questionText: '你是否愿意参与轮岗培训项目？轮岗培训让员工在多个部门或职位间转换，帮助其拓宽知识面和技能，通常在大型跨国公司或快速发展的企业中实施。',
  },
  {
    id: 'trainingPrograms-rotation-2',
    dimension: '培训项目',
    dimensionKey: 'trainingPrograms',
    questionNumber: 2,
    subCategory: '轮岗',
    questionText: '轮岗项目让你能够了解公司多个业务领域，提升全局观念并积累跨职能经验。许多大型企业（如IBM、GE）提供轮岗计划，员工可以在不同岗位上工作，从而增强他们的管理能力和决策能力。',
  },
  {
    id: 'trainingPrograms-rotation-3',
    dimension: '培训项目',
    dimensionKey: 'trainingPrograms',
    questionNumber: 3,
    subCategory: '轮岗',
    questionText: '轮岗是否能让你对不同的工作领域产生新的兴趣或发现自己的优势领域？通过轮岗，你可以接触到不同的业务领域和工作内容，这可能让你重新评估自己最感兴趣和最擅长的领域。',
  },
  {
    id: 'trainingPrograms-rotation-4',
    dimension: '培训项目',
    dimensionKey: 'trainingPrograms',
    questionNumber: 4,
    subCategory: '轮岗',
    questionText: '如果你参与了轮岗，是否会让你对更多领域产生兴趣，甚至改变你的职业方向？轮岗可以帮助你发现自己在不同领域的适应性和兴趣，进而影响你的职业选择，可能从某个技术专才角色转向更具战略性的岗位。',
  },
  {
    id: 'trainingPrograms-rotation-5',
    dimension: '培训项目',
    dimensionKey: 'trainingPrograms',
    questionNumber: 5,
    subCategory: '轮岗',
    questionText: '参与轮岗项目的员工通常具备更强的跨职能能力，这对市场上的职业机会有何影响？具有轮岗经验的员工往往能展现出更强的适应性和多面性，企业更愿意雇佣那些能够跨部门合作、在不同岗位间游刃有余的人才。',
  },

  // ========== 9. 培训项目 - 内部创业 ==========
  {
    id: 'trainingPrograms-intrapreneurship-1',
    dimension: '培训项目',
    dimensionKey: 'trainingPrograms',
    questionNumber: 1,
    subCategory: '内部创业',
    questionText: '你是否考虑参与公司内部创业项目？内部创业项目是一些公司提供的机会，让员工在公司内独立负责创业性项目，通常会为员工提供资金、资源和平台进行创新实验。',
  },
  {
    id: 'trainingPrograms-intrapreneurship-2',
    dimension: '培训项目',
    dimensionKey: 'trainingPrograms',
    questionNumber: 2,
    subCategory: '内部创业',
    questionText: '内部创业项目允许你在企业内部创造新的产品或服务，像创业一样推动公司业务的创新。例如，谷歌的"20%时间"政策允许员工用部分时间来开发自己的项目，这种做法激发了大量创新。',
  },
  {
    id: 'trainingPrograms-intrapreneurship-3',
    dimension: '培训项目',
    dimensionKey: 'trainingPrograms',
    questionNumber: 3,
    subCategory: '内部创业',
    questionText: '如果你参与内部创业项目，你能否在创新或新兴市场领域中获得更多的经验？通过内部创业，你有机会从零开始构建一个项目，这对于提升创新能力和市场洞察力至关重要，特别是对科技、互联网和产品开发领域尤为有利。',
  },
  {
    id: 'trainingPrograms-intrapreneurship-4',
    dimension: '培训项目',
    dimensionKey: 'trainingPrograms',
    questionNumber: 4,
    subCategory: '内部创业',
    questionText: '如果你选择了内部创业，是否意味着你可能对创业领域产生更多兴趣？内部创业可以让你尝试创意和产品开发，这可能激发你走向外部创业的兴趣，尤其是如果你享受快速发展的环境和创新挑战。',
  },
  {
    id: 'trainingPrograms-intrapreneurship-5',
    dimension: '培训项目',
    dimensionKey: 'trainingPrograms',
    questionNumber: 5,
    subCategory: '内部创业',
    questionText: '拥有内部创业经验的员工往往具备高层次的创新能力、资源整合能力和战略思维，这对人才市场有何影响？具有内部创业经验的员工在市场上往往更受欢迎，尤其是在初创公司或希望推动创新的企业中，因他们拥有创新和管理企业项目的实际经验。',
  },

  // ========== 9. 培训项目 - 专业硬技能 ==========
  {
    id: 'trainingPrograms-hardSkills-1',
    dimension: '培训项目',
    dimensionKey: 'trainingPrograms',
    questionNumber: 1,
    subCategory: '专业硬技能',
    questionText: '你是否考虑提升某些专业硬技能（如编程、财务分析等）？硬技能通常是特定领域的专业能力，如计算机编程、财务建模、数据分析等，这些技能对你的职业定位和薪资水平有重要影响。',
  },
  {
    id: 'trainingPrograms-hardSkills-2',
    dimension: '培训项目',
    dimensionKey: 'trainingPrograms',
    questionNumber: 2,
    subCategory: '专业硬技能',
    questionText: '硬技能直接与某些技术岗位或专业领域的工作要求挂钩，它们是你在某个专业领域内立足的基础。例如，IT行业要求扎实的编程技能，金融行业要求精通财务报表分析和建模，数据科学领域要求掌握统计学和机器学习技能。',
  },
  {
    id: 'trainingPrograms-hardSkills-3',
    dimension: '培训项目',
    dimensionKey: 'trainingPrograms',
    questionNumber: 3,
    subCategory: '专业硬技能',
    questionText: '硬技能能否提升你在某些专业领域的竞争力？具备特定硬技能的员工在技术密集型行业中（如AI、金融、IT）具有竞争优势，因为这些技能是求职的基础要求。',
  },
  {
    id: 'trainingPrograms-hardSkills-4',
    dimension: '培训项目',
    dimensionKey: 'trainingPrograms',
    questionNumber: 4,
    subCategory: '专业硬技能',
    questionText: '如果你决定学习某项硬技能，是否会使你重新考虑是否进入某些技术密集型或专业要求较高的行业？学习硬技能可能会使你进入数据分析、编程等技术领域，改变你过去可能偏好的领域（如管理或市场营销）。',
  },
  {
    id: 'trainingPrograms-hardSkills-5',
    dimension: '培训项目',
    dimensionKey: 'trainingPrograms',
    questionNumber: 5,
    subCategory: '专业硬技能',
    questionText: '硬技能在人才市场上通常与职位要求直接挂钩，这些技能对求职和晋升有什么影响？硬技能能够使你在技术职位中脱颖而出，许多行业（如IT、金融、医疗）对具备高技术能力的人才需求量大，这让你在求职市场上的竞争力大大增强。',
  },

  // ========== 9. 培训项目 - 软技能 ==========
  {
    id: 'trainingPrograms-softSkills-1',
    dimension: '培训项目',
    dimensionKey: 'trainingPrograms',
    questionNumber: 1,
    subCategory: '软技能',
    questionText: '你是否有意提升你的软技能（如沟通能力、团队合作、情商等）？软技能包括沟通、领导力、团队协作、时间管理等，这些能力在职场中越来越受到重视，尤其是在管理职位和跨部门合作中。',
  },
  {
    id: 'trainingPrograms-softSkills-2',
    dimension: '培训项目',
    dimensionKey: 'trainingPrograms',
    questionNumber: 2,
    subCategory: '软技能',
    questionText: '软技能决定了你如何与他人互动，如何处理工作中的挑战和人际关系，它们能极大地影响你的工作效率和领导能力。例如，良好的沟通能力有助于提高工作中的信息传递效率，情商则有助于你在团队中建立良好的合作氛围。',
  },
  {
    id: 'trainingPrograms-softSkills-3',
    dimension: '培训项目',
    dimensionKey: 'trainingPrograms',
    questionNumber: 3,
    subCategory: '软技能',
    questionText: '软技能能否提升你在团队合作、管理职位和跨职能工作的能力？软技能对管理、项目协调、客户关系等职位至关重要，这些职位要求不仅是专业技能，更需要良好的沟通和解决问题的能力。',
  },
  {
    id: 'trainingPrograms-softSkills-4',
    dimension: '培训项目',
    dimensionKey: 'trainingPrograms',
    questionNumber: 4,
    subCategory: '软技能',
    questionText: '软技能的提升是否会改变你从事技术职位向管理职位或人际交往较多的职业方向转变？如果你提升了软技能，尤其是在领导力、沟通和情商等方面，你可能更倾向于转向管理岗位，尤其是在需要团队协作和跨部门合作的领域。',
  },
  {
    id: 'trainingPrograms-softSkills-5',
    dimension: '培训项目',
    dimensionKey: 'trainingPrograms',
    questionNumber: 5,
    subCategory: '软技能',
    questionText: '软技能在人才市场中越发重要，如何评估自己的软技能并让其在竞争激烈的市场中脱颖而出？许多企业，尤其是跨国公司，已将软技能列为招聘和晋升的核心标准。具备出色软技能的人才在职场中往往能获得更广泛的机会。',
  },

  // ========== 9. 培训项目 - 行动学习 ==========
  {
    id: 'trainingPrograms-actionLearning-1',
    dimension: '培训项目',
    dimensionKey: 'trainingPrograms',
    questionNumber: 1,
    subCategory: '行动学习',
    questionText: '你是否愿意参与行动学习项目？行动学习是一种通过实践来学习和解决实际问题的方式，通常通过小组合作解决公司面临的真实问题，既能提升实际操作能力，又能增强团队协作。',
  },
  {
    id: 'trainingPrograms-actionLearning-2',
    dimension: '培训项目',
    dimensionKey: 'trainingPrograms',
    questionNumber: 2,
    subCategory: '行动学习',
    questionText: '通过解决实际业务问题，行动学习可以帮助你在实践中锻炼决策、问题解决和创新能力。例如，哈佛商学院的行动学习课程要求学员通过参与真实的商业项目，实践理论知识，这种方式能加速你的职业技能提升。',
  },
  {
    id: 'trainingPrograms-actionLearning-3',
    dimension: '培训项目',
    dimensionKey: 'trainingPrograms',
    questionNumber: 3,
    subCategory: '行动学习',
    questionText: '行动学习能否帮助你在感兴趣的领域中积累更多的实际经验？如果你从事咨询、产品管理、企业战略等领域，行动学习提供的实际问题解决经验将帮助你提升实战能力并加速职业晋升。',
  },
  {
    id: 'trainingPrograms-actionLearning-4',
    dimension: '培训项目',
    dimensionKey: 'trainingPrograms',
    questionNumber: 4,
    subCategory: '行动学习',
    questionText: '参与行动学习是否意味着你会更关注实际应用和解决问题的能力，而非单纯的理论研究？行动学习能让你接触到实际的商业挑战，这可能促使你对实际问题解决产生更大兴趣，从而调整你的职业方向。',
  },
  {
    id: 'trainingPrograms-actionLearning-5',
    dimension: '培训项目',
    dimensionKey: 'trainingPrograms',
    questionNumber: 5,
    subCategory: '行动学习',
    questionText: '具有行动学习经历的员工通常具备较强的解决问题和创新能力，这在市场上有何竞争优势？行动学习的参与者通常能够解决复杂的业务问题，具备创新和战略思维，因此在人才市场上具有较强的竞争力。',
  },

  // ========== 9. 培训项目 - 知识库 ==========
  {
    id: 'trainingPrograms-knowledgeBase-1',
    dimension: '培训项目',
    dimensionKey: 'trainingPrograms',
    questionNumber: 1,
    subCategory: '知识库',
    questionText: '你是否有意参与知识库建设或分享？知识库包括公司内部共享的文档、研究报告、最佳实践等，通过积累和共享知识，企业能够提高效率和创新能力。',
  },
  {
    id: 'trainingPrograms-knowledgeBase-2',
    dimension: '培训项目',
    dimensionKey: 'trainingPrograms',
    questionNumber: 2,
    subCategory: '知识库',
    questionText: '通过参与知识库建设，你能够积累更多的行业知识，提升专业能力，并为公司提供增值的知识支持。如咨询公司通常有庞大的知识库系统，员工通过访问和贡献内容来提升整体工作效率和行业竞争力。',
  },
  {
    id: 'trainingPrograms-knowledgeBase-3',
    dimension: '培训项目',
    dimensionKey: 'trainingPrograms',
    questionNumber: 3,
    subCategory: '知识库',
    questionText: '在你感兴趣的领域，参与知识库的建设是否能帮助你积累更深的专业知识？通过参与公司知识库，你将能够接触到该行业的最新动态和最佳实践，这对你的专业成长和领域理解至关重要。',
  },
  {
    id: 'trainingPrograms-knowledgeBase-4',
    dimension: '培训项目',
    dimensionKey: 'trainingPrograms',
    questionNumber: 4,
    subCategory: '知识库',
    questionText: '如果你深入参与知识库建设，是否意味着你更倾向于专注于某个领域的知识积累，而非实践操作？知识库通常偏重于理论和知识积累，这可能使你从实践工作转向更专注于研究、分析和知识管理的领域。',
  },
  {
    id: 'trainingPrograms-knowledgeBase-5',
    dimension: '培训项目',
    dimensionKey: 'trainingPrograms',
    questionNumber: 5,
    subCategory: '知识库',
    questionText: '具备知识库建设或管理经验的员工，是否在人才市场上具有更多优势？参与知识库建设的人才通常具备较强的研究能力和行业深度，这些技能使他们在咨询、研究和高级分析领域具有竞争力。',
  },

  // ========== 9. 培训项目 - 文化与准则 ==========
  {
    id: 'trainingPrograms-culture-1',
    dimension: '培训项目',
    dimensionKey: 'trainingPrograms',
    questionNumber: 1,
    subCategory: '文化与准则',
    questionText: '你是否愿意了解并参与公司文化与准则培训？公司文化与准则培训帮助员工理解公司的价值观、行为规范和发展战略，以确保其与企业文化保持一致。',
  },
  {
    id: 'trainingPrograms-culture-2',
    dimension: '培训项目',
    dimensionKey: 'trainingPrograms',
    questionNumber: 2,
    subCategory: '文化与准则',
    questionText: '参与文化与准则培训能帮助你更好地融入公司，理解公司的核心价值和期望，对你的职业发展有什么影响？',
  },
  {
    id: 'trainingPrograms-culture-3',
    dimension: '培训项目',
    dimensionKey: 'trainingPrograms',
    questionNumber: 3,
    subCategory: '文化与准则',
    questionText: '公司文化与准则培训是否能帮助你更好地理解你所在领域的工作方式和期望？',
  },
  {
    id: 'trainingPrograms-culture-4',
    dimension: '培训项目',
    dimensionKey: 'trainingPrograms',
    questionNumber: 4,
    subCategory: '文化与准则',
    questionText: '参与文化与准则培训是否会改变你对某些行业或公司类型的兴趣？',
  },
  {
    id: 'trainingPrograms-culture-5',
    dimension: '培训项目',
    dimensionKey: 'trainingPrograms',
    questionNumber: 5,
    subCategory: '文化与准则',
    questionText: '在人才市场上，对公司文化的理解和适应能力如何影响你的竞争力？',
  },

  // ========== 10. 加班偏好 ==========
  {
    id: 'overtimePreference-1',
    dimension: '加班偏好',
    dimensionKey: 'overtimePreference',
    questionNumber: 1,
    questionText: '你能接受的工作时长和工作强度是怎样的？目前中国的市场上你知道什么类型的平台在适用哪一种工作时长和工作强度？你了解964的这种工作时长目前只存在于中国的外资企业吗？你清楚不同工作强度的平台对人才的画像是什么样的吗？',
  },
  {
    id: 'overtimePreference-2',
    dimension: '加班偏好',
    dimensionKey: 'overtimePreference',
    questionNumber: 2,
    questionText: '加班偏好的选择反映了你对工作与生活平衡的重视程度，以及对职业压力的适应能力。你清楚你自己想要什么样的平衡吗？你了解自己对压力的适应和处理能力吗？',
  },
  {
    id: 'overtimePreference-3',
    dimension: '加班偏好',
    dimensionKey: 'overtimePreference',
    questionNumber: 3,
    questionText: '高强度的加班文化可能会出现在创业公司或某些高压行业，你的选择将影响你在这些领域的职业路径。你所选择的行业普遍的工作强度是什么样的？',
  },
  {
    id: 'overtimePreference-4',
    dimension: '加班偏好',
    dimensionKey: 'overtimePreference',
    questionNumber: 4,
    questionText: '如果你选择了更高强度的工作模式，是否意味着你清楚这个强度对你的健康和生活的影响？你是否认为高强度的工作对应高回报行业（如金融、互联网等）？你了解多高强度对应多高的回报吗？你认为的回报里都有什么？你的兴趣排在第几位？',
  },
  {
    id: 'overtimePreference-5',
    dimension: '加班偏好',
    dimensionKey: 'overtimePreference',
    questionNumber: 5,
    questionText: '人才市场上对加班文化的接受度如何？如何选择能够提供你所期望的工作节奏和职业发展机会的平台？中国目前的人才市场对于工作强度与工作效率的定位？你了解工作强度与工作效率的关系吗？你了解不同规模的平台对工作效率以及工作强度的定义和标准都有所不同吗？你了解什么样的平台的工作效率和强度是相似的？',
  },

  // ========== 11. 假期天数 ==========
  {
    id: 'holidayPolicy-1',
    dimension: '假期天数',
    dimensionKey: 'holidayPolicy',
    questionNumber: 1,
    questionText: '你期望的假期天数是多少？不同的假期政策都存在于什么类型的平台？作为年轻人才，你了解与管理层或者老员工的假期政策差别吗？你了解外资平台一般来说管理层与一线员工的假期待遇是无差别的吗？你知道是为什么吗？',
  },
  {
    id: 'holidayPolicy-2',
    dimension: '假期天数',
    dimensionKey: 'holidayPolicy',
    questionNumber: 2,
    questionText: '不同的假期政策反映工作与生活平衡的文化和对员工休息的重视程度吗？这对你未来的生活方式意味着什么？',
  },
  {
    id: 'holidayPolicy-3',
    dimension: '假期天数',
    dimensionKey: 'holidayPolicy',
    questionNumber: 3,
    questionText: '不同领域的假期政策差异如何影响你的工作状态和工作效率？',
  },
  {
    id: 'holidayPolicy-4',
    dimension: '假期天数',
    dimensionKey: 'holidayPolicy',
    questionNumber: 4,
    questionText: '你的兴趣需要哪个程度的员工福利和生活平衡的行业？你是否可以在你的兴趣与职业找到一个平衡？',
  },
  {
    id: 'holidayPolicy-5',
    dimension: '假期天数',
    dimensionKey: 'holidayPolicy',
    questionNumber: 5,
    questionText: '你的选择在人才市场上会被如何看待？你所选择的行业、城市与自我定位对你在假期的选择上有什么样的影响？',
  },

  // ========== 12. 医疗保障 ==========
  {
    id: 'medicalBenefits-1',
    dimension: '医疗保障',
    dimensionKey: 'medicalBenefits',
    questionNumber: 1,
    questionText: '你期望的医疗保障水平是多少？这些不同的医疗保障分别对应哪些类型的平台？不同程度的医疗保障都分别包括哪些医疗选项？你会希望牙科护理在你的医疗保障中吗？你了解目前市场上提供牙科护理保障的平台都有哪些吗？你了解这些平台在公共领域还是私人领域？你了解平台在哪些行业吗？你了解这些平台所在领域及行业的位置吗？你会希望有自己的私人医生涵盖在你的医疗保障中吗？你了解提供涵盖私人医生的医疗保障的平台都有哪些吗？你是否了解中国目前对于外资投资及建立医院的政策倾向？你了解目前中国的哪些城市拥有多少三甲公立医院以及多少高水准的综合全科民营医院吗？',
  },
  {
    id: 'medicalBenefits-2',
    dimension: '医疗保障',
    dimensionKey: 'medicalBenefits',
    questionNumber: 2,
    questionText: '不同的医疗保障意味着你对健康保障的重视程度，以及对工作环境中福利的期望。你认为以上提到的牙科护理、私人医生等医疗保障对你来说意味着什么？对你的生活方式的选择意味着什么？',
  },
  {
    id: 'medicalBenefits-3',
    dimension: '医疗保障',
    dimensionKey: 'medicalBenefits',
    questionNumber: 3,
    questionText: '某些领域（例如跨国公司或大型企业）可能会提供更高水平的医疗保障，这会影响你的选择吗？关于医疗保障，你是否会将它排在影响你选择的因素的前几位？',
  },
  {
    id: 'medicalBenefits-4',
    dimension: '医疗保障',
    dimensionKey: 'medicalBenefits',
    questionNumber: 4,
    questionText: '你的兴趣领域是否要求有更好的医疗保障？如果你的自我定位对身体健康或精神健康有极大影响，你是否考虑过更换你的兴趣领域？你了解自己身体的物理极限吗？你了解自己的精神极限吗？你所选择的城市、领域、行业的人才目前的精神状态以及身体健康状态是何水平？',
  },
  {
    id: 'medicalBenefits-5',
    dimension: '医疗保障',
    dimensionKey: 'medicalBenefits',
    questionNumber: 5,
    questionText: '不同的平台对员工健康保障的投入程度如何影响你在求职市场的选择？你所选择的领域对应的人才市场是否提供你理想的医疗保障？你所选择的领域对应的人才市场的医疗保障普遍是什么水平？包含哪些内容？涵盖哪些服务？所使用的频率是什么样的？',
  },

  // ========== 13. 生育福利 ==========
  {
    id: 'maternityBenefits-1',
    dimension: '生育福利',
    dimensionKey: 'maternityBenefits',
    questionNumber: 1,
    questionText: '你期望的生育福利是什么？你知道中国为数不多提供员工生殖福利的平台有哪几个吗？他们分别都是哪几个行业？为什么他们可以提供生殖福利？你是否有清晰的婚育计划？你了解基本的生殖科学知识吗？这是否是你未来人生的重要组成部分？你是否有接触过生殖领域和遗传领域的专业人士？你目前对生育有着清晰的概念吗？你了解生和育的重点吗？你是否对亲密关系有精神层面的追求，如果有你要求的程度高吗？你了解生和育对亲密关系的影响吗？你了解中国现行的法律对于生育方面的具体条款吗？你是否做过系统的了解？你了解婚姻和生育的关系吗？你了解中国出台具体相关政策的中央政府部门和地方政府部门都是哪几个吗？你了解生和育分别都有一个对应的商业市场吗？你了解在你所选择的城市生和育的政策是什么？其相对应的商业成本、社会成本都是什么样的吗？',
  },
  {
    id: 'maternityBenefits-2',
    dimension: '生育福利',
    dimensionKey: 'maternityBenefits',
    questionNumber: 2,
    questionText: '生育福利反映了一个公司或行业对员工家庭规划的支持程度？对于你的人生意味着什么？对于你的生活方式意味着什么？如果你没有生育计划，你是否理解这在你选择的城市和平台的环境中意味着什么样的职业选择以及舆论压力？如果你有生育计划，你是否了解在你选择的城市和平台的环境中，意味着什么样的职业选择以及物质、精神基础？',
  },
  {
    id: 'maternityBenefits-3',
    dimension: '生育福利',
    dimensionKey: 'maternityBenefits',
    questionNumber: 3,
    questionText: '哪些行业可能提供更为完善的生育福利（如某互联网公司提供女性员工冻卵的福利、某医疗大健康公司提供生殖遗传病的检测福利等等）？这可能会影响你对这些领域的兴趣吗？',
  },
  {
    id: 'maternityBenefits-4',
    dimension: '生育福利',
    dimensionKey: 'maternityBenefits',
    questionNumber: 4,
    questionText: '选择更好的生育福利可能使你倾向于那些注重员工生活质量和福利的公司或行业。',
  },
  {
    id: 'maternityBenefits-5',
    dimension: '生育福利',
    dimensionKey: 'maternityBenefits',
    questionNumber: 5,
    questionText: '生育福利政策的优劣如何影响公司在市场中的竞争力，特别是在年轻人才的吸引上？你了解中国人才市场上不同城市不同行业对未婚未育、已婚未育、已婚已育、以及未婚已育男性员工的生育定位吗？人才市场对于未婚未育、已婚未育、已婚已育、以及未婚已育的女性职业经理人是什么样的定位？你知道女性员工生育假期的延长加重了女性在职场的困境吗？你知道国际市场尤其西方发达国家法律规定了对于员工生育政策不分男女吗（比如欧洲一些国家强制要求男性员工休同样的产假以及长达1-3年的育儿假，一方面来解决职场的男女就业不平等一方面增强男性作为父亲在家庭、婚姻以及育儿中的意识和参与比例）？作为一个年轻人才，你了解中国不同领域（如学术、政治、商业、宗教等）对于年轻人生育的期待和定位吗？',
  },
]

// 获取按维度分组的问题
export function getQuestionsByDimension(dimensionKey: string): Question[] {
  return QUESTIONS.filter((q) => q.dimensionKey === dimensionKey)
}

// 获取按维度和子分类分组的问题
export function getQuestionsBySubCategory(
  dimensionKey: string,
  subCategory: string
): Question[] {
  return QUESTIONS.filter(
    (q) => q.dimensionKey === dimensionKey && q.subCategory === subCategory
  )
}

// 获取所有维度的统计信息
export function getDimensionStats(): Record<string, { total: number; withSubCategory: boolean }> {
  const stats: Record<string, { total: number; withSubCategory: boolean }> = {}

  DIMENSIONS.forEach((dim) => {
    const questions = getQuestionsByDimension(dim.key)
    stats[dim.key] = {
      total: questions.length,
      withSubCategory: questions.some((q) => q.subCategory),
    }
  })

  return stats
}

// 导出动态问题相关
export { LOCATION_SPECIFIC_QUESTIONS, INDUSTRY_SPECIFIC_QUESTIONS }

export default QUESTIONS