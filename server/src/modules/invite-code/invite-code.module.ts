import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { InviteCode } from './entities/invite-code.entity'
import { InviteCodeController } from './invite-code.controller'
import { InviteCodeService } from './invite-code.service'

/**
 * 邀请码模块
 * 提供邀请码的创建、验证、管理功能
 */
@Module({
  imports: [TypeOrmModule.forFeature([InviteCode])],
  controllers: [InviteCodeController],
  providers: [InviteCodeService],
  exports: [InviteCodeService],
})
export class InviteCodeModule {}
