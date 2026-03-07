import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common'
import { Observable } from 'rxjs'
import { tap } from 'rxjs/operators'
import { Request, Response } from 'express'

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP')

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp()
    const request = ctx.getRequest<Request>()
    const response = ctx.getResponse<Response>()

    const { method, url, body } = request
    const startTime = Date.now()

    // 生成追踪 ID
    const traceId =
      request.headers['x-trace-id'] ||
      `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // 记录请求
    this.logger.log(`[${traceId}] --> ${method} ${url}`)
    if (Object.keys(body || {}).length > 0) {
      this.logger.debug(`[${traceId}] Request Body: ${JSON.stringify(body)}`)
    }

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - startTime
          this.logger.log(`[${traceId}] <-- ${method} ${url} ${response.statusCode} ${duration}ms`)
        },
        error: (error) => {
          const duration = Date.now() - startTime
          this.logger.error(
            `[${traceId}] <-- ${method} ${url} ERROR ${duration}ms: ${error.message}`,
          )
        },
      }),
    )
  }
}
