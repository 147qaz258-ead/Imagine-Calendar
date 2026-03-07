import {
  Controller,
  Get,
  Put,
  Post,
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
import { UpdateDimensionDto, CognitiveHistoryQueryDto, CompareCognitiveMapDto } from './dto'

interface RequestWithUser {
  user: { id: string; phone: string }
}

@ApiTags('cognitive-map')
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
  @ApiOperation({ summary: '对比认知图谱' })
  async compareCognitiveMaps(@Body() dto: CompareCognitiveMapDto) {
    return this.cognitiveService.compareCognitiveMaps(dto)
  }
}
