/**
 * 筛选模块类型定义
 * 根据 API-CONTRACT.md 唯一可信源定义
 */

/**
 * 用户偏好（13维度）
 */
export interface UserPreferences {
  locations: string[]           // 地点偏好
  selfPositioning: string[]     // 自我定位
  developmentDirection: string[]// 发展方向
  industries: string[]          // 行业偏好
  platformTypes: string[]       // 平台性质
  companyScales: string[]       // 企业规模
  companyCulture: string[]      // 企业文化
  leadershipStyle: string[]     // 领导风格
  trainingPrograms: string[]    // 培训项目
  overtimePreference: string[]  // 加班偏好
  holidayPolicy: string[]       // 假期偏好
  medicalBenefits: string[]     // 医疗保障
  maternityBenefits: string[]   // 生育福利
}

/**
 * 筛选选项
 */
export interface FilterOption {
  value: string
  label: string
  description?: string
}

/**
 * 筛选选项响应
 */
export interface FilterOptionsResponse {
  success: boolean
  data: {
    locations: FilterOption[]
    selfPositioning: FilterOption[]
    developmentDirection: FilterOption[]
    industries: FilterOption[]
    platformTypes: FilterOption[]
    companyScales: FilterOption[]
    companyCulture: FilterOption[]
    leadershipStyle: FilterOption[]
    trainingPrograms: FilterOption[]
    overtimePreference: FilterOption[]
    holidayPolicy: FilterOption[]
    medicalBenefits: FilterOption[]
    maternityBenefits: FilterOption[]
  }
}

/**
 * 筛选事件请求
 */
export interface FilterEventsRequest {
  preferences: Partial<UserPreferences>
  dateRange?: {
    start: string  // YYYY-MM-DD
    end: string    // YYYY-MM-DD
  }
  page?: number
  pageSize?: number
}

/**
 * 筛选事件响应
 */
export interface FilterEventsResponse {
  success: boolean
  data: {
    events: FilteredEvent[]
    total: number
    page: number
    pageSize: number
  }
}

/**
 * 筛选后的事件
 */
export interface FilteredEvent {
  id: string
  title: string
  company: string
  companyType: string
  position: string
  eventDate: string
  matchScore?: number  // 匹配度分数
}

/**
 * 匹配度分析请求
 */
export interface MatchingAnalyzeRequest {
  eventId: string
}

/**
 * 维度匹配结果
 */
export interface DimensionMatch {
  name: string
  score: number
  matched: boolean
  gap?: string  // 差距说明
}

/**
 * 匹配度分析响应
 */
export interface MatchingAnalyzeResponse {
  success: boolean
  data: {
    overallScore: number    // 总匹配度 0-100
    dimensions: DimensionMatch[]
    suggestions: string[]   // 改进建议
  }
}

/**
 * 维度配置
 */
export interface DimensionConfig {
  key: keyof UserPreferences
  label: string
  icon?: string
  description?: string
}

/**
 * 13维度配置列表
 */
export const FILTER_DIMENSIONS: DimensionConfig[] = [
  { key: 'locations', label: '地点', description: '期望工作城市' },
  { key: 'selfPositioning', label: '自我定位', description: '你对自己的定位' },
  { key: 'developmentDirection', label: '发展方向', description: '职业发展方向' },
  { key: 'industries', label: '行业', description: '感兴趣的行业' },
  { key: 'platformTypes', label: '平台性质', description: '企业类型偏好' },
  { key: 'companyScales', label: '企业规模', description: '企业人数规模' },
  { key: 'companyCulture', label: '企业文化', description: '期望的企业文化' },
  { key: 'leadershipStyle', label: '领导风格', description: '期望的领导风格' },
  { key: 'trainingPrograms', label: '培训项目', description: '期望的培训机会' },
  { key: 'overtimePreference', label: '加班偏好', description: '对加班的态度' },
  { key: 'holidayPolicy', label: '假期', description: '假期福利偏好' },
  { key: 'medicalBenefits', label: '医疗保障', description: '医疗保障偏好' },
  { key: 'maternityBenefits', label: '生育福利', description: '生育福利偏好' },
]

/**
 * 预设方案
 */
export interface FilterPreset {
  id: string
  name: string
  description: string
  icon: string
  preferences: Partial<UserPreferences>
}

/**
 * 预设方案列表
 */
export const FILTER_PRESETS: FilterPreset[] = [
  {
    id: 'internet',
    name: '互联网大厂',
    description: '追求技术成长，接受较大工作强度',
    icon: 'code',
    preferences: {
      platformTypes: ['private', 'foreign'],
      companyScales: ['5000+', '1000-5000'],
      companyCulture: ['innovation', 'open'],
      overtimePreference: ['flexible'],
      trainingPrograms: ['technical', 'leadership'],
      developmentDirection: ['technical', 'management'],
    },
  },
  {
    id: 'soe',
    name: '国企稳定',
    description: '追求工作稳定，重视福利保障',
    icon: 'building',
    preferences: {
      platformTypes: ['soe', 'government'],
      companyScales: ['5000+', '1000-5000'],
      overtimePreference: ['rarely', 'never'],
      holidayPolicy: ['paid-annual', 'flexible'],
      medicalBenefits: ['comprehensive'],
      maternityBenefits: ['full'],
    },
  },
  {
    id: 'startup',
    name: '创业公司',
    description: '追求快速成长，接受高风险高回报',
    icon: 'rocket',
    preferences: {
      platformTypes: ['startup', 'private'],
      companyScales: ['50-200', '200-500'],
      companyCulture: ['innovation', 'flat'],
      leadershipStyle: ['hands-on'],
      trainingPrograms: ['onjob', 'mentor'],
      developmentDirection: ['entrepreneurial'],
    },
  },
  {
    id: 'work-life-balance',
    name: '工作生活平衡',
    description: '重视个人时间，追求健康生活方式',
    icon: 'balance',
    preferences: {
      overtimePreference: ['rarely', 'never'],
      holidayPolicy: ['paid-annual', 'flexible'],
      companyCulture: ['work-life-balance'],
      medicalBenefits: ['comprehensive'],
      maternityBenefits: ['full'],
    },
  },
]