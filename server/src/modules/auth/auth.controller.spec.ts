import { Test, TestingModule } from '@nestjs/testing'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { SendCodeDto, LoginDto, RefreshTokenDto } from './dto'

describe('AuthController', () => {
  let controller: AuthController
  let service: AuthService

  const mockAuthService = {
    sendCode: jest.fn(),
    login: jest.fn(),
    refreshToken: jest.fn(),
    getCurrentUser: jest.fn(),
    logout: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile()

    controller = module.get<AuthController>(AuthController)
    service = module.get<AuthService>(AuthService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('sendCode', () => {
    it('should send verification code', async () => {
      const dto: SendCodeDto = { phone: '13800138000', scene: 'login' }
      mockAuthService.sendCode.mockResolvedValue({
        success: true,
        message: '验证码已发送',
        expiresIn: 300,
      })

      const result = await controller.sendCode(dto)

      expect(result).toEqual({
        success: true,
        message: '验证码已发送',
        data: { expiresIn: 300 },
      })
      expect(service.sendCode).toHaveBeenCalledWith(dto)
    })
  })

  describe('login', () => {
    it('should login user successfully', async () => {
      const dto: LoginDto = { phone: '13800138000', code: '123456' }
      const mockResponse = {
        success: true,
        data: {
          user: { id: 'uuid', phone: '13800138000' },
          token: 'mock-token',
          expiresIn: 604800,
          isNewUser: false,
        },
      }
      mockAuthService.login.mockResolvedValue(mockResponse)

      const result = await controller.login(dto)

      expect(result).toEqual(mockResponse)
      expect(service.login).toHaveBeenCalledWith(dto)
    })
  })

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const dto: RefreshTokenDto = { token: 'old-token' }
      const mockResponse = {
        success: true,
        data: {
          token: 'new-token',
          expiresIn: 604800,
        },
      }
      mockAuthService.refreshToken.mockResolvedValue(mockResponse)

      const result = await controller.refreshToken(dto)

      expect(result).toEqual(mockResponse)
      expect(service.refreshToken).toHaveBeenCalledWith(dto)
    })
  })

  describe('getCurrentUser', () => {
    it('should return current user', async () => {
      const mockUser = { id: 'uuid', phone: '13800138000', status: 'active' }
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser)

      const result = await controller.getCurrentUser({ user: { sub: 'uuid' } })

      expect(result).toEqual({
        success: true,
        data: mockUser,
      })
      expect(service.getCurrentUser).toHaveBeenCalledWith('uuid')
    })
  })

  describe('logout', () => {
    it('should logout successfully', async () => {
      mockAuthService.logout.mockResolvedValue({ success: true })

      const result = await controller.logout({
        headers: { authorization: 'Bearer mock-token' },
      })

      expect(result).toEqual({ success: true })
      expect(service.logout).toHaveBeenCalledWith('mock-token')
    })
  })
})
