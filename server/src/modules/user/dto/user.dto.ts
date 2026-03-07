import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString, IsNumber, IsArray } from 'class-validator'

/**
 * 用户偏好 DTO（13维度）
 * 对应 API-CONTRACT.md UserPreferences
 */
export class UserPreferencesDto {
  @ApiPropertyOptional({ description: '地点偏好', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  locations?: string[]

  @ApiPropertyOptional({ description: '自我定位', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  selfPositioning?: string[]

  @ApiPropertyOptional({ description: '发展方向', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  developmentDirection?: string[]

  @ApiPropertyOptional({ description: '行业偏好', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  industries?: string[]

  @ApiPropertyOptional({ description: '平台性质', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  platformTypes?: string[]

  @ApiPropertyOptional({ description: '企业规模', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  companyScales?: string[]

  @ApiPropertyOptional({ description: '企业文化', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  companyCulture?: string[]

  @ApiPropertyOptional({ description: '领导风格', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  leadershipStyle?: string[]

  @ApiPropertyOptional({ description: '培训项目', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  trainingPrograms?: string[]

  @ApiPropertyOptional({ description: '加班偏好', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  overtimePreference?: string[]

  @ApiPropertyOptional({ description: '假期偏好', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  holidayPolicy?: string[]

  @ApiPropertyOptional({ description: '医疗保障', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  medicalBenefits?: string[]

  @ApiPropertyOptional({ description: '生育福利', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  maternityBenefits?: string[]
}

/**
 * 更新用户画像请求 DTO
 * PUT /api/users/:id/profile
 */
export class UpdateProfileDto {
  @ApiPropertyOptional({ description: '昵称' })
  @IsOptional()
  @IsString()
  nickname?: string

  @ApiPropertyOptional({ description: '头像URL' })
  @IsOptional()
  @IsString()
  avatar?: string

  @ApiPropertyOptional({ description: '学校' })
  @IsOptional()
  @IsString()
  school?: string

  @ApiPropertyOptional({ description: '专业' })
  @IsOptional()
  @IsString()
  major?: string

  @ApiPropertyOptional({ description: '年级' })
  @IsOptional()
  @IsString()
  grade?: string

  @ApiPropertyOptional({ description: '学号' })
  @IsOptional()
  @IsString()
  studentId?: string

  @ApiPropertyOptional({ description: '毕业年份' })
  @IsOptional()
  @IsNumber()
  graduationYear?: number
}

/**
 * 更新用户偏好请求 DTO
 * PUT /api/users/:id/preferences
 */
export class UpdatePreferencesDto {
  @ApiProperty({ description: '用户偏好（13维度）' })
  @IsOptional()
  preferences?: Partial<UserPreferencesDto>
}

/**
 * 学校查询参数 DTO
 * GET /api/schools
 */
export class SchoolQueryDto {
  @ApiPropertyOptional({ description: '搜索关键词' })
  @IsOptional()
  @IsString()
  keyword?: string

  @ApiPropertyOptional({ description: '省份筛选' })
  @IsOptional()
  @IsString()
  province?: string

  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsOptional()
  @IsNumber()
  page?: number

  @ApiPropertyOptional({ description: '每页数量', default: 20 })
  @IsOptional()
  @IsNumber()
  pageSize?: number
}

/**
 * 专业查询参数 DTO
 * GET /api/majors
 */
export class MajorQueryDto {
  @ApiPropertyOptional({ description: '搜索关键词' })
  @IsOptional()
  @IsString()
  keyword?: string

  @ApiPropertyOptional({ description: '类别筛选' })
  @IsOptional()
  @IsString()
  category?: string

  @ApiPropertyOptional({ description: '页码', default: 1 })
  @IsOptional()
  @IsNumber()
  page?: number

  @ApiPropertyOptional({ description: '每页数量', default: 20 })
  @IsOptional()
  @IsNumber()
  pageSize?: number
}
