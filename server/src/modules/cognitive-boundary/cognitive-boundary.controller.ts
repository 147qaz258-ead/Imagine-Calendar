import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CognitiveBoundaryService } from './cognitive-boundary.service'
import { SubmitAssessmentDto, UpdateQuestionAssessmentDto } from './dto'

@ApiTags('cognitive-boundary')
@ApiBearerAuth()
@Controller('cognitive-boundary')
@UseGuards(JwtAuthGuard)
export class CognitiveBoundaryController {
  constructor(private readonly cognitiveBoundaryService: CognitiveBoundaryService) {}

  /**
   * 获取当前用户的认知边界评估
   * GET /api/cognitive-boundary/assessment
   */
  @Get('assessment')
  @ApiOperation({ summary: '获取当前用户的认知边界评估' })
  async getAssessment(@Request() req: { user: { id: string } }) {
    return this.cognitiveBoundaryService.getAssessment(req.user.id)
  }

  /**
   * 获取指定用户的认知边界评估
   * GET /api/cognitive-boundary/assessment/:userId
   */
  @Get('assessment/:userId')
  @ApiOperation({ summary: '获取指定用户的认知边界评估' })
  async getUserAssessment(@Param('userId') userId: string) {
    return this.cognitiveBoundaryService.getAssessment(userId)
  }

  /**
   * 提交问题评估
   * POST /api/cognitive-boundary/assessment
   */
  @Post('assessment')
  @ApiOperation({ summary: '提交问题评估' })
  async submitAssessment(
    @Request() req: { user: { id: string } },
    @Body() dto: SubmitAssessmentDto,
  ) {
    return this.cognitiveBoundaryService.submitAssessment(req.user.id, dto)
  }

  /**
   * 更新单个问题的评估
   * PUT /api/cognitive-boundary/assessment/:questionId
   */
  @Put('assessment/:questionId')
  @ApiOperation({ summary: '更新单个问题的评估' })
  async updateQuestionAssessment(
    @Request() req: { user: { id: string } },
    @Param('questionId') questionId: string,
    @Body() dto: UpdateQuestionAssessmentDto,
  ) {
    return this.cognitiveBoundaryService.updateQuestionAssessment(
      req.user.id,
      questionId,
      dto,
    )
  }

  /**
   * 获取评估历史
   * GET /api/cognitive-boundary/assessment/history
   */
  @Get('assessment/history')
  @ApiOperation({ summary: '获取评估历史' })
  async getAssessmentHistory(@Request() req: { user: { id: string } }) {
    return this.cognitiveBoundaryService.getAssessmentHistory(req.user.id)
  }
}