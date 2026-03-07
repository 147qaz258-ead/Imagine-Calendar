import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { User, UserProfile, School, Major, VerificationCode } from './entities'
import { UserService } from './user.service'
import { UserController, SchoolController, MajorController } from './user.controller'

/**
 * 用户模块
 * 提供用户画像相关功能
 */
@Module({
  imports: [TypeOrmModule.forFeature([User, UserProfile, School, Major, VerificationCode])],
  controllers: [UserController, SchoolController, MajorController],
  providers: [UserService],
  exports: [UserService, TypeOrmModule],
})
export class UserModule {}
