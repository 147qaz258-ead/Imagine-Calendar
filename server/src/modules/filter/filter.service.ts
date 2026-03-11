import { Injectable } from '@nestjs/common'

/**
 * 筛选选项接口
 */
export interface FilterOption {
  value: string
  label: string
  description?: string
}

/**
 * 城市选项接口
 */
export interface CityOption {
  name: string
}

/**
 * 省份选项接口
 */
export interface ProvinceOption {
  name: string
  cities: CityOption[]
}

/**
 * 筛选选项响应接口
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
 * 省市联动响应接口
 */
export interface ProvinceCityResponse {
  success: boolean
  data: ProvinceOption[]
}

/**
 * 筛选服务
 * 提供各维度的筛选选项数据
 */
@Injectable()
export class FilterService {
  // 缓存省市数据
  private provincesCache: ProvinceOption[] | null = null

  /**
   * 获取省市联动数据
   */
  getLocationsWithProvinces(): ProvinceCityResponse {
    if (this.provincesCache) {
      return { success: true, data: this.provincesCache }
    }

    try {
      // 动态导入 JSON 数据
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const pcData = require('../../data/provinces-cities.json')

      const provinces: ProvinceOption[] = Object.entries(pcData).map(
        ([provinceName, cities]) => ({
          name: provinceName,
          cities: (cities as string[]).map((cityName) => ({
            name: cityName,
          })),
        })
      )

      this.provincesCache = provinces
      return { success: true, data: provinces }
    } catch (error) {
      console.error('加载省市数据失败:', error)
      return { success: false, data: [] }
    }
  }

  /**
   * 获取所有筛选选项
   */
  getFilterOptions(): FilterOptionsResponse {
    return {
      success: true,
      data: {
        locations: this.getLocations(),
        selfPositioning: this.getSelfPositioning(),
        developmentDirection: this.getDevelopmentDirection(),
        industries: this.getIndustries(),
        platformTypes: this.getPlatformTypes(),
        companyScales: this.getCompanyScales(),
        companyCulture: this.getCompanyCulture(),
        leadershipStyle: this.getLeadershipStyle(),
        trainingPrograms: this.getTrainingPrograms(),
        overtimePreference: this.getOvertimePreference(),
        holidayPolicy: this.getHolidayPolicy(),
        medicalBenefits: this.getMedicalBenefits(),
        maternityBenefits: this.getMaternityBenefits(),
      },
    }
  }

  /**
   * 1. 工作地点
   */
  private getLocations(): FilterOption[] {
    return [
      { value: 'beijing', label: '北京' },
      { value: 'shanghai', label: '上海' },
      { value: 'shenzhen', label: '深圳' },
      { value: 'hangzhou', label: '杭州' },
      { value: 'chengdu', label: '成都' },
      { value: 'other', label: '其他' },
    ]
  }

  /**
   * 2. 自我定位
   */
  private getSelfPositioning(): FilterOption[] {
    return [
      { value: 'technical', label: '技术' },
      { value: 'product', label: '产品' },
      { value: 'operation', label: '运营' },
      { value: 'sales', label: '销售' },
      { value: 'functional', label: '职能' },
    ]
  }

  /**
   * 3. 发展方向
   */
  private getDevelopmentDirection(): FilterOption[] {
    return [
      { value: 'specialist', label: '深耕专业', description: '在专业领域持续深耕' },
      { value: 'management', label: '管理路线', description: '向管理方向发展' },
      { value: 'entrepreneurship', label: '创业', description: '自主创业或加入创业团队' },
      { value: 'freelance', label: '自由职业', description: '自由职业或独立顾问' },
    ]
  }

  /**
   * 4. 行业领域
   */
  private getIndustries(): FilterOption[] {
    return [
      { value: 'internet', label: '互联网' },
      { value: 'finance', label: '金融' },
      { value: 'manufacturing', label: '制造业' },
      { value: 'education', label: '教育' },
      { value: 'healthcare', label: '医疗' },
      { value: 'other', label: '其他' },
    ]
  }

  /**
   * 5. 平台类型
   */
  private getPlatformTypes(): FilterOption[] {
    return [
      { value: 'state_owned', label: '国企' },
      { value: 'foreign', label: '外企' },
      { value: 'private', label: '民企' },
      { value: 'public_institution', label: '事业单位' },
    ]
  }

  /**
   * 6. 公司规模
   */
  private getCompanyScales(): FilterOption[] {
    return [
      { value: 'under_50', label: '50人以下' },
      { value: '50_200', label: '50-200人' },
      { value: '200_1000', label: '200-1000人' },
      { value: 'over_1000', label: '1000人以上' },
    ]
  }

  /**
   * 7. 公司文化
   */
  private getCompanyCulture(): FilterOption[] {
    return [
      { value: 'flat', label: '扁平化', description: '层级少，沟通直接高效' },
      { value: 'hierarchical', label: '层级分明', description: '清晰的汇报关系和晋升路径' },
      { value: 'innovation_oriented', label: '创新导向', description: '鼓励尝试新事物，容忍失败' },
      { value: 'stability_oriented', label: '稳定导向', description: '注重流程规范，稳健发展' },
    ]
  }

  /**
   * 8. 领导风格
   */
  private getLeadershipStyle(): FilterOption[] {
    return [
      { value: 'mentor', label: '导师型', description: '注重培养下属，提供指导和支持' },
      { value: 'delegating', label: '放权型', description: '给予充分自主权，结果导向' },
      { value: 'directive', label: '指令型', description: '明确指示任务，严格把控过程' },
      { value: 'collaborative', label: '协作型', description: '平等参与，共同决策' },
    ]
  }

  /**
   * 9. 培训体系
   */
  private getTrainingPrograms(): FilterOption[] {
    return [
      { value: 'systematic', label: '有系统培训', description: '完善的培训体系和课程' },
      { value: 'mentorship', label: '导师带教', description: '一对一导师指导学习' },
      { value: 'self_learning', label: '自学为主', description: '依靠自学和项目实践成长' },
    ]
  }

  /**
   * 10. 加班偏好
   */
  private getOvertimePreference(): FilterOption[] {
    return [
      { value: '965', label: '965', description: '早9晚6双休，工作生活平衡' },
      { value: '996_accept', label: '996接受', description: '可以接受高强度工作节奏' },
      { value: 'flexible', label: '弹性工作', description: '工作时间灵活，结果导向' },
    ]
  }

  /**
   * 11. 休假制度
   */
  private getHolidayPolicy(): FilterOption[] {
    return [
      { value: 'double_off', label: '双休' },
      { value: 'single_off', label: '单休' },
      { value: 'big_small_week', label: '大小周' },
    ]
  }

  /**
   * 12. 医疗保障
   */
  private getMedicalBenefits(): FilterOption[] {
    return [
      { value: 'basic', label: '基础五险', description: '基础社会保险保障' },
      { value: 'supplementary', label: '补充医疗', description: '额外商业医疗保险' },
      { value: 'premium', label: '高端医疗', description: '高端医疗保险，就医体验好' },
    ]
  }

  /**
   * 13. 生育福利
   */
  private getMaternityBenefits(): FilterOption[] {
    return [
      { value: 'none', label: '无', description: '无额外生育福利' },
      { value: 'basic', label: '基础', description: '基本产假和生育津贴' },
      { value: 'comprehensive', label: '完善', description: '延长产假、育儿假、哺乳室等' },
    ]
  }
}
