import { IsString, IsIn, Matches, Length } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

/**
 * 发送验证码请求 DTO
 * 对应 API-CONTRACT.md 2.1 SendCodeRequest
 */
export class SendCodeDto {
  @ApiProperty({
    description: '手机号',
    example: '13800138000',
  })
  @IsString()
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式错误' })
  phone: string

  @ApiProperty({
    description: '场景',
    enum: ['login', 'register'],
    example: 'login',
  })
  @IsString()
  @IsIn(['login', 'register'])
  scene: 'login' | 'register'
}
