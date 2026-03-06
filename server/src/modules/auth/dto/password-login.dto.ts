import { IsString, Matches, MinLength, MaxLength } from 'class-validator'

export class PasswordLoginDto {
  @IsString()
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式错误' })
  phone: string

  @IsString()
  @MinLength(6, { message: '密码长度错误' })
  @MaxLength(20, { message: '密码长度错误' })
  password: string
}
