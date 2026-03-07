import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common'
import { RoundTableService } from './roundtable.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { RoundTableQueryDto, ApplyRoundTableDto, SubmitSummaryDto } from './dto'

interface RequestWithUser {
  user: { id: string; phone: string }
}

@ApiTags('round-tables')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('round-tables')
export class RoundTableController {
  constructor(private readonly roundTableService: RoundTableService) {}

  /**
   * 获取圆桌列表
   * GET /api/round-tables
   * 对应 API-CONTRACT.md 6.1
   */
  @Get()
  @ApiOperation({ summary: '获取圆桌列表' })
  async getRoundTables(@Query() query: RoundTableQueryDto) {
    return this.roundTableService.getRoundTables(query)
  }

  /**
   * 创建圆桌报名
   * POST /api/round-tables/apply
   * 对应 API-CONTRACT.md 6.2
   */
  @Post('apply')
  @ApiOperation({ summary: '创建圆桌报名' })
  async apply(@Request() req: RequestWithUser, @Body() dto: ApplyRoundTableDto) {
    return this.roundTableService.apply(req.user.id, dto)
  }

  /**
   * 获取圆桌问题清单
   * GET /api/round-tables/questions
   * 对应 API-CONTRACT.md 6.7
   */
  @Get('questions')
  @ApiOperation({ summary: '获取圆桌问题清单' })
  async getQuestions() {
    return this.roundTableService.getQuestions()
  }

  /**
   * 获取我的圆桌
   * GET /api/round-tables/my
   */
  @Get('my')
  @ApiOperation({ summary: '获取我的圆桌' })
  async getMyRoundTables(@Request() req: RequestWithUser) {
    return this.roundTableService.getMyRoundTables(req.user.id)
  }

  /**
   * 获取圆桌详情
   * GET /api/round-tables/:id
   * 对应 API-CONTRACT.md 6.3
   */
  @Get(':id')
  @ApiOperation({ summary: '获取圆桌详情' })
  async getRoundTableDetail(@Param('id', ParseUUIDPipe) id: string) {
    return this.roundTableService.getRoundTableDetail(id)
  }

  /**
   * 加入圆桌
   * POST /api/round-tables/:id/join
   * 对应 API-CONTRACT.md 6.4
   */
  @Post(':id/join')
  @ApiOperation({ summary: '加入圆桌' })
  async joinRoundTable(@Request() req: RequestWithUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.roundTableService.joinRoundTable(req.user.id, id)
  }

  /**
   * 离开圆桌
   * POST /api/round-tables/:id/leave
   * 对应 API-CONTRACT.md 6.5
   */
  @Post(':id/leave')
  @ApiOperation({ summary: '离开圆桌' })
  async leaveRoundTable(@Request() req: RequestWithUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.roundTableService.leaveRoundTable(req.user.id, id)
  }

  /**
   * 提交讨论纪要
   * POST /api/round-tables/:id/summary
   * 对应 API-CONTRACT.md 6.6
   */
  @Post(':id/summary')
  @ApiOperation({ summary: '提交讨论纪要' })
  async submitSummary(
    @Request() req: RequestWithUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SubmitSummaryDto,
  ) {
    return this.roundTableService.submitSummary(req.user.id, id, dto)
  }

  /**
   * 取消报名
   * POST /api/round-tables/:id/cancel
   */
  @Post(':id/cancel')
  @ApiOperation({ summary: '取消报名' })
  async cancelApplication(@Request() req: RequestWithUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.roundTableService.cancelApplication(req.user.id, id)
  }
}
