import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common'
import { CognitiveService } from './cognitive.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import {
  UpdateDimensionDto,
  CognitiveHistoryQueryDto,
  CompareCognitiveMapDto,
  CreateCognitiveVersionDto,
  CompareVersionsQueryDto,
} from './dto'

interface RequestWithUser {
  user: { id: string; phone: string }
}

@ApiTags('cognitive')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class CognitiveController {
  constructor(private readonly cognitiveService: CognitiveService) {}

  /**
   * 获取认知图谱
   * GET /api/users/:id/cognitive-map
   * 对应 API-CONTRACT.md 7.1
   */
  @Get('users/:id/cognitive-map')
  @ApiOperation({ summary: '获取认知图谱' })
  async getCognitiveMap(@Param('id', ParseUUIDPipe) id: string) {
    return this.cognitiveService.getCognitiveMap(id)
  }

  /**
   * 更新认知维度
   * PUT /api/users/:id/cognitive-map/dimensions
   * 对应 API-CONTRACT.md 7.2
   */
  @Put('users/:id/cognitive-map/dimensions')
  @ApiOperation({ summary: '更新认知维度' })
  async updateDimension(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateDimensionDto) {
    return this.cognitiveService.updateDimension(id, dto)
  }

  /**
   * 获取认知历史
   * GET /api/users/:id/cognitive-map/history
   * 对应 API-CONTRACT.md 7.3
   */
  @Get('users/:id/cognitive-map/history')
  @ApiOperation({ summary: '获取认知历史' })
  async getCognitiveHistory(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: CognitiveHistoryQueryDto,
  ) {
    return this.cognitiveService.getCognitiveHistory(id, query)
  }

  /**
   * 对比认知图谱
   * POST /api/cognitive-map/compare
   * 对应 API-CONTRACT.md 7.4
   */
  @Post('cognitive-map/compare')
  @ApiOperation({ summary: '对比多个用户的认知图谱' })
  async compareCognitiveMaps(@Body() dto: CompareCognitiveMapDto) {
    return this.cognitiveService.compareCognitiveMaps(dto)
  }

  // ============ 版本管理接口 ============

  /**
   * 获取当前用户所有认知版本
   * GET /api/cognitive/versions
   */
  @Get('cognitive/versions')
  @ApiOperation({ summary: '获取所有认知版本' })
  async getCognitiveVersions(@Request() req: RequestWithUser) {
    return this.cognitiveService.getCognitiveVersions(req.user.id)
  }

  /**
   * 创建新版本
   * POST /api/cognitive/version
   */
  @Post('cognitive/version')
  @ApiOperation({ summary: '创建认知版本' })
  async createCognitiveVersion(
    @Request() req: RequestWithUser,
    @Body() dto: CreateCognitiveVersionDto,
  ) {
    return this.cognitiveService.createCognitiveVersion(req.user.id, dto)
  }

  /**
   * 获取单个版本详情
   * GET /api/cognitive/versions/:id
   */
  @Get('cognitive/versions/:id')
  @ApiOperation({ summary: '获取认知版本详情' })
  async getCognitiveVersionById(@Param('id', ParseUUIDPipe) id: string) {
    return this.cognitiveService.getCognitiveVersionById(id)
  }

  /**
   * 对比两个版本
   * GET /api/cognitive/compare?v1=xxx&v2=xxx
   */
  @Get('cognitive/compare')
  @ApiOperation({ summary: '对比两个认知版本' })
  async compareVersions(@Query() query: CompareVersionsQueryDto) {
    return this.cognitiveService.compareVersions(query)
  }
}