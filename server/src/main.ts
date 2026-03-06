import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { AppModule } from './app.module'
import { HttpExceptionFilter } from './common/filters/http-exception.filter'
import { LoggingInterceptor } from './common/interceptors/logging.interceptor'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )

  // 全局异常过滤器
  app.useGlobalFilters(new HttpExceptionFilter())

  // 全局日志拦截器
  app.useGlobalInterceptors(new LoggingInterceptor())

  // CORS 配置
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://localhost:5173', // Vite dev server
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })

  // API 前缀
  app.setGlobalPrefix('api')

  // Swagger 文档配置
  const config = new DocumentBuilder()
    .setTitle('畅选日历 API')
    .setDescription('畅选日历 - 职业规划日历平台 API 文档')
    .setVersion('1.0')
    .addBearerAuth()
    .build()
  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api/docs', app, document)

  const port = process.env.PORT || 3001
  await app.listen(port)
  console.log(`Application is running on: http://localhost:${port}`)
  console.log(`Swagger documentation: http://localhost:${port}/api/docs`)
}
bootstrap()