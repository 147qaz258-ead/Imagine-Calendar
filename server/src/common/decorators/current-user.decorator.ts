import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { Request } from 'express'

interface User {
  id: string
  phone: string
  [key: string]: unknown
}

export const CurrentUser = createParamDecorator((data: string, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<Request>()
  const user = request['user'] as User | undefined

  return data ? user?.[data] : user
})
