import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common'

/**
 * 邀请码验证管道
 * 验证邀请码参数格式
 */
@Injectable()
export class InviteCodeValidationPipe implements PipeTransform<string> {
  /**
   * 邀请码最大长度
   */
  private readonly maxLength = 20

  /**
   * 邀请码正则表达式（只允许字母和数字）
   */
  private readonly codePattern = /^[A-Za-z0-9]+$/

  transform(value: string, _metadata: ArgumentMetadata): string {
    if (!value) {
      throw new BadRequestException({
        code: 'INVALID_CODE',
        message: '邀请码不能为空',
      })
    }

    if (value.length > this.maxLength) {
      throw new BadRequestException({
        code: 'INVALID_CODE',
        message: `邀请码长度不能超过${this.maxLength}个字符`,
      })
    }

    if (!this.codePattern.test(value)) {
      throw new BadRequestException({
        code: 'INVALID_CODE',
        message: '邀请码只能包含字母和数字',
      })
    }

    return value.toUpperCase()
  }
}
