import { IsString, Matches, Length } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

/**
 * 登录请求 DTO
 * 对应 API-CONTRACT.md 2.2 LoginRequest
 */
export class LoginDto {
  @ApiProperty({
    description: '手机号',
    example: '13800138000',
  })
  @IsString()
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式错误' })
  phone: string

  @ApiProperty({
    description: '验证码（6位数字）',
    example: '123456',
  })
  @IsString()
  @Length(6, 6, { message: '验证码必须是6位' })
  @Matches(/^\d{6}$/, { message: '验证码格式错误' })
  code: string
}
