import { Controller, Post, Logger } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { Public } from '../../common/decorators/public.decorator'
import { AdminService } from './admin.service'

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  private readonly logger = new Logger(AdminController.name)

  constructor(private readonly adminService: AdminService) {}

  @Post('seed')
  @Public()
  @ApiOperation({ summary: '初始化种子数据', description: '创建测试群组和邀请码' })
  @ApiResponse({ status: 201, description: '种子数据初始化成功' })
  @ApiResponse({ status: 500, description: '初始化失败' })
  async seed() {
    this.logger.log('Received seed request')
    return this.adminService.seed()
  }
}