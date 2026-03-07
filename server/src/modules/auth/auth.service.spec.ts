import { Test, TestingModule } from '@nestjs/testing'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { AuthService } from './auth.service'
import { User, UserStatus } from '../user/entities/user.entity'
import { VerificationCode } from '../user/entities/verification-code.entity'
import { SendCodeDto, LoginDto } from './dto'

// Mock ioredis module
jest.mock('ioredis', () => {
  const MockRedis = jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    incr: jest.fn(),
    expire: jest.fn(),
    ttl: jest.fn(),
    on: jest.fn(),
  }))
  return { default: MockRedis }
})

describe('AuthService', () => {
  let service: AuthService
  let userRepository: Repository<User>
  let codeRepository: Repository<VerificationCode>
  let jwtService: JwtService

  const mockUser: Partial<User> = {
    id: 'test-uuid',
    phone: '13800138000',
    status: UserStatus.ACTIVE,
    lastLoginAt: undefined,
    nickname: undefined,
    avatar: undefined,
    school: undefined,
    major: undefined,
    grade: undefined,
    studentId: undefined,
    graduationYear: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      const config: Record<string, any> = {
        JWT_SECRET: 'test-secret-key-for-testing',
        JWT_EXPIRES_IN: '7d',
        REDIS_HOST: 'localhost',
        REDIS_PORT: 6379,
      }
      return config[key] ?? defaultValue
    }),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn().mockResolvedValue('mock-jwt-token'),
            verifyAsync: jest.fn().mockResolvedValue({ sub: 'test-uuid', phone: '13800138000' }),
            decode: jest
              .fn()
              .mockReturnValue({ sub: 'test-uuid', exp: Math.floor(Date.now() / 1000) + 3600 }),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(VerificationCode),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile()

    service = module.get<AuthService>(AuthService)
    userRepository = module.get<Repository<User>>(getRepositoryToken(User))
    codeRepository = module.get<Repository<VerificationCode>>(getRepositoryToken(VerificationCode))
    jwtService = module.get<JwtService>(JwtService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('sendCode', () => {
    it('should send verification code successfully', async () => {
      const dto: SendCodeDto = { phone: '13800138000', scene: 'login' }

      // Mock Redis methods
      ;(service['redis'].get as jest.Mock).mockResolvedValue(null)
      ;(service['redis'].setex as jest.Mock).mockResolvedValue('OK')
      ;(service['redis'].ttl as jest.Mock).mockResolvedValue(60)
      ;(codeRepository.create as jest.Mock).mockReturnValue({})
      ;(codeRepository.save as jest.Mock).mockResolvedValue({})

      const result = await service.sendCode(dto)

      expect(result.success).toBe(true)
      expect(result.message).toBe('验证码已发送')
      expect(result.expiresIn).toBe(300)
    })

    it('should throw error when rate limited', async () => {
      const dto: SendCodeDto = { phone: '13800138000', scene: 'login' }

      // Mock rate limited
      ;(service['redis'].get as jest.Mock).mockResolvedValue('1')
      ;(service['redis'].ttl as jest.Mock).mockResolvedValue(30)

      await expect(service.sendCode(dto)).rejects.toThrow('发送过于频繁')
    })
  })

  describe('login', () => {
    it('should login existing user successfully', async () => {
      const dto: LoginDto = { phone: '13800138000', code: '123456' }

      // Mock Redis
      ;(service['redis'].get as jest.Mock).mockImplementation((key: string) => {
        if (key.startsWith('auth:attempt:')) return Promise.resolve(null)
        if (key.startsWith('auth:code:')) return Promise.resolve('123456')
        return Promise.resolve(null)
      })
      ;(service['redis'].del as jest.Mock).mockResolvedValue(1)
      ;(service['redis'].incr as jest.Mock).mockResolvedValue(1)

      // Mock user repository
      ;(userRepository.findOne as jest.Mock).mockResolvedValue(mockUser)
      ;(userRepository.save as jest.Mock).mockResolvedValue(mockUser)

      const result = await service.login(dto)

      expect(result.success).toBe(true)
      expect(result.data.isNewUser).toBe(false)
      expect(result.data.token).toBe('mock-jwt-token')
    })

    it('should register new user successfully', async () => {
      const dto: LoginDto = { phone: '13900139000', code: '123456' }

      // Mock Redis
      ;(service['redis'].get as jest.Mock).mockImplementation((key: string) => {
        if (key.startsWith('auth:attempt:')) return Promise.resolve(null)
        if (key.startsWith('auth:code:')) return Promise.resolve('123456')
        return Promise.resolve(null)
      })
      ;(service['redis'].del as jest.Mock).mockResolvedValue(1)

      // Mock user repository - user not found, then create
      ;(userRepository.findOne as jest.Mock).mockResolvedValue(null)
      ;(userRepository.create as jest.Mock).mockReturnValue({
        id: 'new-uuid',
        phone: '13900139000',
        status: UserStatus.ACTIVE,
        lastLoginAt: undefined,
        nickname: undefined,
        avatar: undefined,
        school: undefined,
        major: undefined,
        grade: undefined,
        studentId: undefined,
        graduationYear: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      ;(userRepository.save as jest.Mock).mockResolvedValue({
        id: 'new-uuid',
        phone: '13900139000',
        status: UserStatus.ACTIVE,
        lastLoginAt: undefined,
        nickname: undefined,
        avatar: undefined,
        school: undefined,
        major: undefined,
        grade: undefined,
        studentId: undefined,
        graduationYear: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const result = await service.login(dto)

      expect(result.success).toBe(true)
      expect(result.data.isNewUser).toBe(true)
    })

    it('should throw error when code expired', async () => {
      const dto: LoginDto = { phone: '13800138000', code: '123456' }

      // Mock Redis - no code stored
      ;(service['redis'].get as jest.Mock).mockImplementation((key: string) => {
        if (key.startsWith('auth:attempt:')) return Promise.resolve(null)
        if (key.startsWith('auth:code:')) return Promise.resolve(null)
        return Promise.resolve(null)
      })

      await expect(service.login(dto)).rejects.toThrow('验证码已过期')
    })

    it('should throw error when code invalid', async () => {
      const dto: LoginDto = { phone: '13800138000', code: '654321' }

      // Mock Redis
      ;(service['redis'].get as jest.Mock).mockImplementation((key: string) => {
        if (key.startsWith('auth:attempt:')) return Promise.resolve(null)
        if (key.startsWith('auth:code:')) return Promise.resolve('123456') // Different code
        return Promise.resolve(null)
      })
      ;(service['redis'].incr as jest.Mock).mockResolvedValue(1)
      ;(service['redis'].expire as jest.Mock).mockResolvedValue(1)

      await expect(service.login(dto)).rejects.toThrow('验证码错误')
    })

    it('should throw error when too many attempts', async () => {
      const dto: LoginDto = { phone: '13800138000', code: '123456' }

      // Mock Redis - too many attempts
      ;(service['redis'].get as jest.Mock).mockImplementation((key: string) => {
        if (key.startsWith('auth:attempt:')) return Promise.resolve('3')
        return Promise.resolve(null)
      })
      ;(service['redis'].ttl as jest.Mock).mockResolvedValue(120)

      await expect(service.login(dto)).rejects.toThrow('尝试次数过多')
    })
  })

  describe('getCurrentUser', () => {
    it('should return user when found', async () => {
      ;(userRepository.findOne as jest.Mock).mockResolvedValue(mockUser)

      const result = await service.getCurrentUser('test-uuid')

      expect(result).toEqual(mockUser)
    })

    it('should throw error when user not found', async () => {
      ;(userRepository.findOne as jest.Mock).mockResolvedValue(null)

      await expect(service.getCurrentUser('invalid-uuid')).rejects.toThrow('用户不存在')
    })
  })

  describe('logout', () => {
    it('should blacklist token successfully', async () => {
      ;(service['redis'].setex as jest.Mock).mockResolvedValue('OK')

      const result = await service.logout('valid-token')

      expect(result.success).toBe(true)
    })
  })
})
