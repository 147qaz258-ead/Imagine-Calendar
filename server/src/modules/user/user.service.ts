import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, Like } from 'typeorm'
import { User, UserStatus } from './entities/user.entity'
import { UserProfile, UserPreferences } from './entities/user-profile.entity'
import { School } from './entities/school.entity'
import { Major } from './entities/major.entity'
import { UpdateProfileDto, UpdatePreferencesDto, SchoolQueryDto, MajorQueryDto } from './dto'

/**
 * 用户服务
 * 实现用户画像相关业务逻辑
 */
@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name)

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserProfile)
    private profileRepository: Repository<UserProfile>,
    @InjectRepository(School)
    private schoolRepository: Repository<School>,
    @InjectRepository(Major)
    private majorRepository: Repository<Major>,
  ) {}

  /**
   * 获取用户画像
   * GET /api/users/:id/profile
   */
  async getProfile(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['profile'],
    })

    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: '用户不存在',
      })
    }

    // 如果没有 profile，创建一个空的
    let profile = user.profile
    if (!profile) {
      profile = this.profileRepository.create({
        userId: user.id,
        preferences: this.getDefaultPreferences(),
      })
      await this.profileRepository.save(profile)
    }

    // 获取学校和专业名称
    let schoolInfo = null
    let majorInfo = null

    if (profile.schoolId) {
      const school = await this.schoolRepository.findOne({
        where: { id: profile.schoolId },
      })
      if (school) {
        schoolInfo = { id: school.id, name: school.name }
      }
    }

    if (profile.majorId) {
      const major = await this.majorRepository.findOne({
        where: { id: profile.majorId },
      })
      if (major) {
        majorInfo = { id: major.id, name: major.name }
      }
    }

    return {
      success: true,
      data: {
        id: user.id,
        phone: user.phone,
        nickname: user.nickname,
        avatar: user.avatar,
        school: schoolInfo,
        major: majorInfo,
        grade: profile.grade,
        graduationYear: profile.graduationYear,
        city: profile.city,
        name: profile.name,
        studentId: profile.studentId,
        preferences: profile.preferences,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    }
  }

  /**
   * 更新用户画像
   * PUT /api/users/:id/profile
   */
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['profile'],
    })

    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: '用户不存在',
      })
    }

    // 更新 User 表字段
    if (dto.nickname !== undefined) {
      user.nickname = dto.nickname
    }
    if (dto.avatar !== undefined) {
      user.avatar = dto.avatar
    }
    if (dto.school !== undefined) {
      user.school = dto.school
    }
    if (dto.major !== undefined) {
      user.major = dto.major
    }
    if (dto.grade !== undefined) {
      user.grade = dto.grade
    }
    if (dto.studentId !== undefined) {
      user.studentId = dto.studentId
    }
    if (dto.graduationYear !== undefined) {
      user.graduationYear = dto.graduationYear
    }

    await this.userRepository.save(user)

    // 确保 profile 存在
    let profile = user.profile
    if (!profile) {
      profile = this.profileRepository.create({
        userId: user.id,
        preferences: this.getDefaultPreferences(),
      })
    }

    // 更新 profile 字段
    if (dto.grade !== undefined) {
      profile.grade = dto.grade
    }
    if (dto.graduationYear !== undefined) {
      profile.graduationYear = dto.graduationYear
    }

    await this.profileRepository.save(profile)

    this.logger.log(`User profile updated: ${userId}`)

    return this.getProfile(userId)
  }

  /**
   * 更新用户偏好
   * PUT /api/users/:id/preferences
   */
  async updatePreferences(userId: string, dto: UpdatePreferencesDto) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['profile'],
    })

    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: '用户不存在',
      })
    }

    // 确保 profile 存在
    let profile = user.profile
    if (!profile) {
      profile = this.profileRepository.create({
        userId: user.id,
        preferences: this.getDefaultPreferences(),
      })
      await this.profileRepository.save(profile)
    }

    // 合并偏好
    if (dto.preferences) {
      profile.preferences = {
        ...profile.preferences,
        ...dto.preferences,
      }
      await this.profileRepository.save(profile)
    }

    // 计算匹配度评分
    const matchingScore = this.calculateMatchingScore(profile.preferences)

    this.logger.log(`User preferences updated: ${userId}, score: ${matchingScore}`)

    return {
      success: true,
      data: {
        preferences: profile.preferences,
        matchingScore,
      },
    }
  }

  /**
   * 上传学生证（OCR Mock）
   * POST /api/users/:id/student-card
   */
  async uploadStudentCard(userId: string, file: Express.Multer.File) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    })

    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: '用户不存在',
      })
    }

    if (!file) {
      throw new BadRequestException({
        code: 'UPLOAD_FAILED',
        message: '请上传学生证图片',
      })
    }

    // OCR Mock: 返回模拟数据
    // 实际实现时需要调用 OCR 服务
    const mockResult = {
      school: '示例大学',
      major: '计算机科学与技术',
      grade: '大三',
      studentId: '20210101001',
      confidence: 0.95,
    }

    this.logger.log(`Student card uploaded for user: ${userId}`)

    return {
      success: true,
      data: mockResult,
    }
  }

  /**
   * 获取学校列表
   * GET /api/schools
   */
  async getSchools(query: SchoolQueryDto) {
    const { keyword, province, page = 1, pageSize = 20 } = query

    const qb = this.schoolRepository.createQueryBuilder('school')

    if (keyword) {
      qb.andWhere('school.name LIKE :keyword', { keyword: `%${keyword}%` })
    }

    if (province) {
      qb.andWhere('school.province = :province', { province })
    }

    qb.skip((page - 1) * pageSize).take(pageSize)
    qb.orderBy('school.name', 'ASC')

    const [items, total] = await qb.getManyAndCount()

    return {
      success: true,
      data: {
        total,
        items: items.map((item) => ({
          id: item.id,
          name: item.name,
          province: item.province,
          city: item.city,
        })),
      },
    }
  }

  /**
   * 获取专业列表
   * GET /api/majors
   */
  async getMajors(query: MajorQueryDto) {
    const { keyword, category, page = 1, pageSize = 20 } = query

    const qb = this.majorRepository.createQueryBuilder('major')

    if (keyword) {
      qb.andWhere('major.name LIKE :keyword', { keyword: `%${keyword}%` })
    }

    if (category) {
      qb.andWhere('major.category = :category', { category })
    }

    qb.skip((page - 1) * pageSize).take(pageSize)
    qb.orderBy('major.name', 'ASC')

    const [items, total] = await qb.getManyAndCount()

    return {
      success: true,
      data: {
        total,
        items: items.map((item) => ({
          id: item.id,
          name: item.name,
          category: item.category,
        })),
      },
    }
  }

  /**
   * 根据年级计算毕业年份
   */
  calculateGraduationYear(grade: string): number | null {
    const currentYear = new Date().getFullYear()
    const gradeMap: Record<string, number> = {
      大一: 0,
      大二: 1,
      大三: 2,
      大四: 3,
      研一: 0,
      研二: 1,
      研三: 2,
      博一: 0,
      博二: 1,
      博三: 2,
    }

    const offset = gradeMap[grade]
    if (offset === undefined) {
      return null
    }

    return currentYear + (4 - offset)
  }

  /**
   * 获取默认偏好设置
   */
  private getDefaultPreferences(): UserPreferences {
    return {
      locations: [],
      selfPositioning: [],
      developmentDirection: [],
      industries: [],
      platformTypes: [],
      companyScales: [],
      companyCulture: [],
      leadershipStyle: [],
      trainingPrograms: [],
      overtimePreference: [],
      holidayPolicy: [],
      medicalBenefits: [],
      maternityBenefits: [],
    }
  }

  /**
   * 计算匹配度评分
   * 基于已填写的偏好维度数量计算
   */
  private calculateMatchingScore(preferences: UserPreferences): number {
    const dimensions = Object.values(preferences)
    const filledDimensions = dimensions.filter((dim) => Array.isArray(dim) && dim.length > 0)
    const score = Math.round((filledDimensions.length / 13) * 100)
    return score
  }
}
