import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam } from '@nestjs/swagger'
import { InviteCodeService } from './invite-code.service'
import {
  CreateInviteCodeDto,
  UpdateInviteCodeDto,
  ValidateInviteCodeDto,
  QueryInviteCodeDto,
} from './dto'
import { InviteCodeValidationPipe } from './pipes'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { Public } from '../../common/decorators/public.decorator'

/**
 * 邀请码控制器
 * 提供邀请码的创建、验证、管理接口
 */
@ApiTags('邀请码')
@Controller('invite-codes')
export class InviteCodeController {
  constructor(private readonly inviteCodeService: InviteCodeService) {}

  /**
   * 创建邀请码
   * POST /api/invite-codes
   */
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建邀请码' })
  @ApiResponse({
    status: 201,
    description: '创建成功',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        code: 'ABCD1234',
        groupId: null,
        createdBy: '123e4567-e89b-12d3-a456-426614174001',
        maxUses: 10,
        usedCount: 0,
        expiresAt: '2024-12-31T23:59:59.000Z',
        status: 'active',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '邀请码已存在',
    schema: {
      example: {
        statusCode: 400,
        message: { code: 'CODE_EXISTS', message: '邀请码已存在' },
      },
    },
  })
  async create(@CurrentUser('id') userId: string, @Body() dto: CreateInviteCodeDto) {
    return this.inviteCodeService.create(userId, dto)
  }

  /**
   * 验证邀请码
   * POST /api/invite-codes/validate
   */
  @Post('validate')
  @Public()
  @ApiOperation({ summary: '验证邀请码' })
  @ApiResponse({
    status: 200,
    description: '验证成功',
    schema: {
      example: {
        valid: true,
        groupId: '123e4567-e89b-12d3-a456-426614174000',
        message: '邀请码有效',
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: '邀请码无效',
    schema: {
      example: {
        valid: false,
        groupId: null,
        message: '邀请码不存在',
      },
    },
  })
  async validate(@Body() dto: ValidateInviteCodeDto) {
    return this.inviteCodeService.validate(dto)
  }

  /**
   * 使用邀请码
   * POST /api/invite-codes/:code/use
   */
  @Post(':code/use')
  @ApiBearerAuth()
  @ApiOperation({ summary: '使用邀请码（增加使用次数）' })
  @ApiParam({ name: 'code', description: '邀请码', type: 'string' })
  @ApiResponse({
    status: 200,
    description: '使用成功',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        code: 'ABCD1234',
        usedCount: 1,
        status: 'active',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '邀请码无效',
    schema: {
      example: {
        statusCode: 400,
        message: { code: 'CODE_INVALID', message: '邀请码已过期' },
      },
    },
  })
  async use(@Param('code', InviteCodeValidationPipe) code: string) {
    return this.inviteCodeService.use(code)
  }

  /**
   * 获取邀请码列表
   * GET /api/invite-codes
   */
  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取邀请码列表' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    schema: {
      example: {
        total: 10,
        items: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            code: 'ABCD1234',
            groupId: null,
            createdBy: '123e4567-e89b-12d3-a456-426614174001',
            maxUses: 10,
            usedCount: 5,
            status: 'active',
            createdAt: '2024-01-01T00:00:00.000Z',
          },
        ],
      },
    },
  })
  async findAll(@Query() query: QueryInviteCodeDto) {
    return this.inviteCodeService.findAll(query)
  }

  /**
   * 获取我创建的邀请码
   * GET /api/invite-codes/my
   */
  @Get('my')
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取我创建的邀请码' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    schema: {
      example: [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          code: 'ABCD1234',
          groupId: null,
          maxUses: 10,
          usedCount: 5,
          status: 'active',
          createdAt: '2024-01-01T00:00:00.000Z',
        },
      ],
    },
  })
  async findByCreator(@CurrentUser('id') userId: string) {
    return this.inviteCodeService.findByCreator(userId)
  }

  /**
   * 获取邀请码详情
   * GET /api/invite-codes/:id
   */
  @Get(':id')
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: '邀请码ID', type: 'string' })
  @ApiOperation({ summary: '获取邀请码详情' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        code: 'ABCD1234',
        groupId: null,
        createdBy: '123e4567-e89b-12d3-a456-426614174001',
        maxUses: 10,
        usedCount: 5,
        status: 'active',
        createdAt: '2024-01-01T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: '邀请码不存在',
    schema: {
      example: {
        statusCode: 404,
        message: { code: 'CODE_NOT_FOUND', message: '邀请码不存在' },
      },
    },
  })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.inviteCodeService.findOne(id)
  }

  /**
   * 更新邀请码
   * PUT /api/invite-codes/:id
   */
  @Put(':id')
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: '邀请码ID', type: 'string' })
  @ApiOperation({ summary: '更新邀请码' })
  @ApiResponse({
    status: 200,
    description: '更新成功',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        code: 'ABCD1234',
        maxUses: 20,
        status: 'active',
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: '无权修改',
    schema: {
      example: {
        statusCode: 403,
        message: { code: 'FORBIDDEN', message: '无权修改此邀请码' },
      },
    },
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateInviteCodeDto,
  ) {
    return this.inviteCodeService.update(id, userId, dto)
  }

  /**
   * 禁用邀请码
   * POST /api/invite-codes/:id/disable
   */
  @Post(':id/disable')
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: '邀请码ID', type: 'string' })
  @ApiOperation({ summary: '禁用邀请码' })
  @ApiResponse({
    status: 200,
    description: '禁用成功',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        code: 'ABCD1234',
        status: 'disabled',
      },
    },
  })
  async disable(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('id') userId: string) {
    return this.inviteCodeService.disable(id, userId)
  }

  /**
   * 启用邀请码
   * POST /api/invite-codes/:id/enable
   */
  @Post(':id/enable')
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: '邀请码ID', type: 'string' })
  @ApiOperation({ summary: '启用邀请码' })
  @ApiResponse({
    status: 200,
    description: '启用成功',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        code: 'ABCD1234',
        status: 'active',
      },
    },
  })
  async enable(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('id') userId: string) {
    return this.inviteCodeService.enable(id, userId)
  }

  /**
   * 删除邀请码
   * DELETE /api/invite-codes/:id
   */
  @Delete(':id')
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: '邀请码ID', type: 'string' })
  @ApiOperation({ summary: '删除邀请码' })
  @ApiResponse({
    status: 204,
    description: '删除成功',
  })
  @ApiResponse({
    status: 403,
    description: '无权删除',
    schema: {
      example: {
        statusCode: 403,
        message: { code: 'FORBIDDEN', message: '无权删除此邀请码' },
      },
    },
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('id') userId: string) {
    await this.inviteCodeService.remove(id, userId)
  }
}
