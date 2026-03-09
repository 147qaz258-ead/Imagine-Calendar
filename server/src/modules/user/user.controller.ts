import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiConsumes,
  ApiParam,
} from '@nestjs/swagger'
import { UserService } from './user.service'
import { UpdateProfileDto, UpdatePreferencesDto, SchoolQueryDto, MajorQueryDto } from './dto'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { Public } from '../../common/decorators/public.decorator'

// Multer configuration for file uploads
const STUDENT_ID_IMAGE_UPLOAD_OPTIONS = {
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
}

/**
 * 用户控制器
 * 对应 API-CONTRACT.md 第3章 用户画像接口
 */
@ApiTags('用户画像')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * 获取用户画像
   * GET /api/users/:id/profile
   */
  @Get(':id/profile')
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: '用户ID', type: 'string' })
  @ApiOperation({ summary: '获取用户画像' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    schema: {
      example: {
        success: true,
        data: {
          id: 'uuid',
          phone: '13800138000',
          nickname: '用户昵称',
          avatar: 'https://example.com/avatar.jpg',
          school: { id: 'uuid', name: '清华大学' },
          major: { id: 'uuid', name: '计算机科学与技术' },
          grade: '大三',
          graduationYear: 2027,
          city: '北京',
          name: '张三',
          studentId: '20210101001',
          studentIdImageUrl: '/uploads/student-id/uuid.jpg',
          isStudentVerified: false,
          preferences: {
            locations: ['北京', '上海'],
            selfPositioning: ['技术专家'],
            developmentDirection: ['人工智能'],
            industries: ['互联网', '金融'],
            platformTypes: ['上市公司'],
            companyScales: ['大型企业'],
            companyCulture: ['开放创新'],
            leadershipStyle: ['技术导向'],
            trainingPrograms: ['导师制'],
            overtimePreference: ['弹性工作'],
            holidayPolicy: ['双休'],
            medicalBenefits: ['商业保险'],
            maternityBenefits: ['产假'],
          },
          status: 'active',
          createdAt: '2026-03-04T00:00:00.000Z',
          updatedAt: '2026-03-04T00:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: '用户不存在',
    schema: {
      example: {
        success: false,
        error: { code: 'USER_NOT_FOUND', message: '用户不存在' },
      },
    },
  })
  async getProfile(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.getProfile(id)
  }

  /**
   * 更新用户画像
   * PUT /api/users/:id/profile
   */
  @Put(':id/profile')
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: '用户ID', type: 'string' })
  @ApiOperation({ summary: '更新用户画像' })
  @ApiResponse({
    status: 200,
    description: '更新成功',
    schema: {
      example: {
        success: true,
        data: {
          id: 'uuid',
          phone: '13800138000',
          nickname: '新昵称',
          avatar: 'https://example.com/new-avatar.jpg',
          school: { id: 'uuid', name: '清华大学' },
          major: { id: 'uuid', name: '计算机科学与技术' },
          grade: '大三',
          graduationYear: 2027,
          city: '北京',
          name: '张三',
          studentId: '20210101001',
          preferences: {},
          status: 'active',
          createdAt: '2026-03-04T00:00:00.000Z',
          updatedAt: '2026-03-04T00:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: '用户不存在',
    schema: {
      example: {
        success: false,
        error: { code: 'USER_NOT_FOUND', message: '用户不存在' },
      },
    },
  })
  async updateProfile(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateProfileDto) {
    return this.userService.updateProfile(id, dto)
  }

  /**
   * 更新用户偏好（13维度）
   * PUT /api/users/:id/preferences
   */
  @Put(':id/preferences')
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: '用户ID', type: 'string' })
  @ApiOperation({ summary: '更新用户偏好（13维度）' })
  @ApiResponse({
    status: 200,
    description: '更新成功',
    schema: {
      example: {
        success: true,
        data: {
          preferences: {
            locations: ['北京', '上海'],
            selfPositioning: ['技术专家'],
            developmentDirection: ['人工智能'],
            industries: ['互联网'],
            platformTypes: ['上市公司'],
            companyScales: ['大型企业'],
            companyCulture: ['开放创新'],
            leadershipStyle: ['技术导向'],
            trainingPrograms: ['导师制'],
            overtimePreference: ['弹性工作'],
            holidayPolicy: ['双休'],
            medicalBenefits: ['商业保险'],
            maternityBenefits: ['产假'],
          },
          matchingScore: 100,
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: '用户不存在',
    schema: {
      example: {
        success: false,
        error: { code: 'USER_NOT_FOUND', message: '用户不存在' },
      },
    },
  })
  async updatePreferences(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePreferencesDto,
  ) {
    return this.userService.updatePreferences(id, dto)
  }

  /**
   * 上传学生证图片（存储）
   * POST /api/users/:id/student-id-image
   */
  @Post(':id/student-id-image')
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: '用户ID', type: 'string' })
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: '上传学生证图片（存储图片）' })
  @ApiResponse({
    status: 200,
    description: '上传成功',
    schema: {
      example: {
        success: true,
        data: {
          studentIdImageUrl: '/uploads/student-id/uuid.jpg',
          isStudentVerified: false,
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '上传失败',
    schema: {
      example: {
        success: false,
        error: { code: 'UPLOAD_FAILED', message: '请上传学生证图片' },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: '无权限',
    schema: {
      example: {
        success: false,
        error: { code: 'FORBIDDEN', message: '只能上传自己的学生证' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('image', STUDENT_ID_IMAGE_UPLOAD_OPTIONS))
  async uploadStudentIdImage(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') currentUserId: string,
  ) {
    // 安全检查：用户只能上传自己的学生证
    if (id !== currentUserId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: '只能上传自己的学生证',
      })
    }
    return this.userService.uploadStudentIdImage(id, file)
  }

  /**
   * 上传学生证（OCR）
   * POST /api/users/:id/student-card
   */
  @Post(':id/student-card')
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: '用户ID', type: 'string' })
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: '上传学生证（OCR识别）' })
  @ApiResponse({
    status: 200,
    description: '识别成功',
    schema: {
      example: {
        success: true,
        data: {
          school: '示例大学',
          major: '计算机科学与技术',
          grade: '大三',
          studentId: '20210101001',
          confidence: 0.95,
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '上传失败',
    schema: {
      example: {
        success: false,
        error: { code: 'UPLOAD_FAILED', message: '请上传学生证图片' },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: '无权限',
    schema: {
      example: {
        success: false,
        error: { code: 'FORBIDDEN', message: '只能上传自己的学生证' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('image', STUDENT_ID_IMAGE_UPLOAD_OPTIONS))
  async uploadStudentCard(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') currentUserId: string,
  ) {
    // 安全检查：用户只能上传自己的学生证
    if (id !== currentUserId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: '只能上传自己的学生证',
      })
    }
    return this.userService.uploadStudentCard(id, file)
  }
}

/**
 * 学校控制器
 * GET /api/schools
 */
@ApiTags('基础数据')
@Controller('schools')
export class SchoolController {
  constructor(private readonly userService: UserService) {}

  /**
   * 获取学校列表
   * GET /api/schools
   */
  @Public()
  @Get()
  @ApiOperation({ summary: '获取学校列表' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    schema: {
      example: {
        success: true,
        data: {
          total: 100,
          items: [
            { id: 'uuid', name: '清华大学', province: '北京', city: '北京' },
            { id: 'uuid', name: '北京大学', province: '北京', city: '北京' },
          ],
        },
      },
    },
  })
  async getSchools(@Query() query: SchoolQueryDto) {
    return this.userService.getSchools(query)
  }
}

/**
 * 专业控制器
 * GET /api/majors
 */
@ApiTags('基础数据')
@Controller('majors')
export class MajorController {
  constructor(private readonly userService: UserService) {}

  /**
   * 获取专业列表
   * GET /api/majors
   */
  @Public()
  @Get()
  @ApiOperation({ summary: '获取专业列表' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    schema: {
      example: {
        success: true,
        data: {
          total: 50,
          items: [
            { id: 'uuid', name: '计算机科学与技术', category: '工学' },
            { id: 'uuid', name: '软件工程', category: '工学' },
          ],
        },
      },
    },
  })
  async getMajors(@Query() query: MajorQueryDto) {
    return this.userService.getMajors(query)
  }
}
