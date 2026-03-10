import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { User } from '../user/entities/user.entity'
import { RoundTable } from '../roundtable/entities/roundtable.entity'
import { InviteCode } from '../invite-code/entities/invite-code.entity'
import { AdminController } from './admin.controller'
import { AdminService } from './admin.service'

/**
 * 管理模块
 * 提供种子数据初始化等功能
 */
@Module({
  imports: [TypeOrmModule.forFeature([User, RoundTable, InviteCode])],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}