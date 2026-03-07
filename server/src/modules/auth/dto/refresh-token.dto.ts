import { IsString, IsNotEmpty } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

/**
 * 刷新 Token 请求 DTO
 * 对应 API-CONTRACT.md 2.3 RefreshRequest
 */
export class RefreshTokenDto {
  @ApiProperty({
    description: 'JWT Token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  @IsNotEmpty({ message: 'Token不能为空' })
  token: string
}
