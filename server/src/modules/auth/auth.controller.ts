import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import { AuthService } from './auth.service'
import { SendCodeDto, LoginDto, RefreshTokenDto, RegisterDto, PasswordLoginDto } from './dto'
import { Public } from '../../common/decorators/public.decorator'

/**
 * 认证控制器
 * 对应 API-CONTRACT.md 第2章 认证接口
 */
@ApiTags('认证')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * 发送验证码
   * POST /api/auth/send-code
   */
  @Public()
  @Post('send-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '发送验证码' })
  @ApiResponse({
    status: 200,
    description: '验证码发送成功',
    schema: {
      example: {
        success: true,
        message: '验证码已发送',
        data: { expiresIn: 300 },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '手机号格式错误',
    schema: {
      example: {
        success: false,
        error: { code: 'AUTH_PHONE_INVALID', message: '手机号格式错误' },
      },
    },
  })
  @ApiResponse({
    status: 429,
    description: '发送过于频繁',
    schema: {
      example: {
        success: false,
        error: { code: 'AUTH_CODE_TOO_FREQUENT', message: '发送过于频繁，请60秒后重试' },
      },
    },
  })
  async sendCode(@Body() dto: SendCodeDto) {
    const result = await this.authService.sendCode(dto)
    return {
      success: true,
      message: result.message,
      data: { expiresIn: result.expiresIn },
    }
  }

  /**
   * 验证码登录/注册
   * POST /api/auth/login
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '验证码登录/注册' })
  @ApiResponse({
    status: 200,
    description: '登录成功',
    schema: {
      example: {
        success: true,
        data: {
          user: {
            id: 'uuid',
            phone: '13800138000',
            nickname: null,
            avatar: null,
            status: 'active',
            createdAt: '2026-03-04T00:00:00.000Z',
          },
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          expiresIn: 604800,
          isNewUser: true,
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '验证码错误或已过期',
    schema: {
      example: {
        success: false,
        error: { code: 'AUTH_CODE_INVALID', message: '验证码错误' },
      },
    },
  })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto)
  }

  /**
   * 密码注册
   * POST /api/auth/register
   */
  @Public()
  @Post('register')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '密码注册' })
  @ApiResponse({
    status: 200,
    description: '注册成功',
    schema: {
      example: {
        success: true,
        data: {
          user: { id: 'uuid', phone: '13800138000', status: 'active' },
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          expiresIn: 604800,
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '验证码错误或手机号已注册',
  })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto)
  }

  /**
   * 密码登录
   * POST /api/auth/login-password
   */
  @Public()
  @Post('login-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '密码登录' })
  @ApiResponse({
    status: 200,
    description: '登录成功',
  })
  @ApiResponse({
    status: 400,
    description: '密码错误或用户不存在',
  })
  async loginWithPassword(@Body() dto: PasswordLoginDto) {
    return this.authService.loginWithPassword(dto)
  }

  /**
   * 刷新 Token
   * POST /api/auth/refresh
   */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '刷新Token' })
  @ApiResponse({
    status: 200,
    description: '刷新成功',
    schema: {
      example: {
        success: true,
        data: {
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          expiresIn: 604800,
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Token无效或已过期',
    schema: {
      example: {
        success: false,
        error: { code: 'AUTH_TOKEN_EXPIRED', message: 'Token已过期' },
      },
    },
  })
  async refreshToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto)
  }

  /**
   * 获取当前用户
   * GET /api/auth/me
   */
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取当前用户信息' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    schema: {
      example: {
        success: true,
        data: {
          id: 'uuid',
          phone: '13800138000',
          nickname: '用户昵称',
          avatar: 'https://example.com/avatar.jpg',
          status: 'active',
          createdAt: '2026-03-04T00:00:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: '未登录',
    schema: {
      example: {
        success: false,
        error: { code: 'AUTH_UNAUTHORIZED', message: '未登录' },
      },
    },
  })
  async getCurrentUser(@Request() req: any) {
    const user = await this.authService.getCurrentUser(req.user.sub)
    return {
      success: true,
      data: user,
    }
  }

  /**
   * 登出
   * POST /api/auth/logout
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: '登出' })
  @ApiResponse({
    status: 200,
    description: '登出成功',
    schema: {
      example: { success: true },
    },
  })
  async logout(@Request() req: any) {
    const token = req.headers.authorization?.split(' ')[1]
    if (token) {
      await this.authService.logout(token)
    }
    return { success: true }
  }
}