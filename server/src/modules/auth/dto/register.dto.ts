import { IsString, Matches, Length, MinLength, MaxLength, IsOptional } from 'class-validator'

export class RegisterDto {
  @IsString()
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式错误' })
  phone: string

  @IsString()
  @Length(6, 6, { message: '验证码必须是6位' })
  code: string

  @IsString()
  @MinLength(6, { message: '密码至少6位' })
  @MaxLength(20, { message: '密码最多20位' })
  @Matches(/^(?=.*[a-zA-Z])(?=.*\d).+$/, { message: '密码必须包含字母和数字' })
  password: string

  @IsOptional()
  @IsString()
  @Length(4, 20, { message: '邀请码长度必须在4-20位之间' })
  inviteCode?: string
}
