import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  ForbiddenException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { InviteCode, InviteCodeStatus } from './entities/invite-code.entity'
import {
  CreateInviteCodeDto,
  UpdateInviteCodeDto,
  ValidateInviteCodeDto,
  QueryInviteCodeDto,
} from './dto'

/**
 * 邀请码服务
 * 提供邀请码的创建、验证、管理等功能
 */
@Injectable()
export class InviteCodeService {
  private readonly logger = new Logger(InviteCodeService.name)

  constructor(
    @InjectRepository(InviteCode)
    private inviteCodeRepository: Repository<InviteCode>,
  ) {}

  /**
   * 生成随机邀请码
   * @param length 邀请码长度，默认8位
   */
  private generateCode(length: number = 8): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < length; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

  /**
   * 创建邀请码
   * POST /api/invite-codes
   */
  async create(userId: string, dto: CreateInviteCodeDto): Promise<InviteCode> {
    // 如果提供了邀请码，检查是否已存在
    if (dto.code) {
      const existing = await this.inviteCodeRepository.findOne({
        where: { code: dto.code },
      })
      if (existing) {
        throw new BadRequestException({
          code: 'CODE_EXISTS',
          message: '邀请码已存在',
        })
      }
    }

    // 生成唯一邀请码
    let code = dto.code
    if (!code) {
      let attempts = 0
      while (attempts < 10) {
        code = this.generateCode()
        const existing = await this.inviteCodeRepository.findOne({
          where: { code },
        })
        if (!existing) break
        attempts++
      }
      if (attempts >= 10) {
        throw new BadRequestException({
          code: 'CODE_GENERATION_FAILED',
          message: '邀请码生成失败，请重试',
        })
      }
    }

    const inviteCode = this.inviteCodeRepository.create({
      code,
      groupId: dto.groupId ?? null,
      createdBy: userId,
      maxUses: dto.maxUses ?? 10,
      usedCount: 0,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      status: InviteCodeStatus.ACTIVE,
    })

    const saved = await this.inviteCodeRepository.save(inviteCode)
    this.logger.log(`Invite code created: ${saved.code} by user: ${userId}`)

    return saved
  }

  /**
   * 验证邀请码
   * POST /api/invite-codes/validate
   */
  async validate(dto: ValidateInviteCodeDto): Promise<{
    valid: boolean
    groupId: string | null
    message: string
  }> {
    const inviteCode = await this.inviteCodeRepository.findOne({
      where: { code: dto.code },
      relations: ['group'],
    })

    if (!inviteCode) {
      return {
        valid: false,
        groupId: null,
        message: '邀请码不存在',
      }
    }

    // 检查状态
    if (inviteCode.status === InviteCodeStatus.DISABLED) {
      return {
        valid: false,
        groupId: null,
        message: '邀请码已被禁用',
      }
    }

    if (inviteCode.status === InviteCodeStatus.EXPIRED) {
      return {
        valid: false,
        groupId: null,
        message: '邀请码已过期',
      }
    }

    // 检查过期时间
    if (inviteCode.expiresAt && new Date() > inviteCode.expiresAt) {
      // 更新状态为过期
      inviteCode.status = InviteCodeStatus.EXPIRED
      await this.inviteCodeRepository.save(inviteCode)
      return {
        valid: false,
        groupId: null,
        message: '邀请码已过期',
      }
    }

    // 检查使用次数
    if (inviteCode.usedCount >= inviteCode.maxUses) {
      return {
        valid: false,
        groupId: null,
        message: '邀请码已达到最大使用次数',
      }
    }

    return {
      valid: true,
      groupId: inviteCode.groupId,
      message: '邀请码有效',
    }
  }

  /**
   * 使用邀请码（增加使用次数）
   * POST /api/invite-codes/:code/use
   */
  async use(code: string): Promise<InviteCode> {
    const inviteCode = await this.inviteCodeRepository.findOne({
      where: { code },
    })

    if (!inviteCode) {
      throw new NotFoundException({
        code: 'CODE_NOT_FOUND',
        message: '邀请码不存在',
      })
    }

    // 验证邀请码
    const validation = await this.validate({ code })
    if (!validation.valid) {
      throw new BadRequestException({
        code: 'CODE_INVALID',
        message: validation.message,
      })
    }

    // 增加使用次数
    inviteCode.usedCount += 1

    // 如果达到最大使用次数，更新状态
    if (inviteCode.usedCount >= inviteCode.maxUses) {
      inviteCode.status = InviteCodeStatus.EXPIRED
    }

    const saved = await this.inviteCodeRepository.save(inviteCode)
    this.logger.log(`Invite code used: ${code}, count: ${saved.usedCount}`)

    return saved
  }

  /**
   * 获取邀请码列表
   * GET /api/invite-codes
   */
  async findAll(query: QueryInviteCodeDto): Promise<{
    total: number
    items: InviteCode[]
  }> {
    const { page = 1, pageSize = 20, status, createdBy } = query

    const qb = this.inviteCodeRepository.createQueryBuilder('inviteCode')

    if (status) {
      qb.andWhere('inviteCode.status = :status', { status })
    }

    if (createdBy) {
      qb.andWhere('inviteCode.createdBy = :createdBy', { createdBy })
    }

    qb.skip((page - 1) * pageSize)
      .take(pageSize)
      .orderBy('inviteCode.createdAt', 'DESC')

    const [items, total] = await qb.getManyAndCount()

    return { total, items }
  }

  /**
   * 获取邀请码详情
   * GET /api/invite-codes/:id
   */
  async findOne(id: string): Promise<InviteCode> {
    const inviteCode = await this.inviteCodeRepository.findOne({
      where: { id },
      relations: ['creator', 'group'],
    })

    if (!inviteCode) {
      throw new NotFoundException({
        code: 'CODE_NOT_FOUND',
        message: '邀请码不存在',
      })
    }

    return inviteCode
  }

  /**
   * 更新邀请码
   * PUT /api/invite-codes/:id
   */
  async update(id: string, userId: string, dto: UpdateInviteCodeDto): Promise<InviteCode> {
    const inviteCode = await this.inviteCodeRepository.findOne({
      where: { id },
    })

    if (!inviteCode) {
      throw new NotFoundException({
        code: 'CODE_NOT_FOUND',
        message: '邀请码不存在',
      })
    }

    // 只有创建者可以更新
    if (inviteCode.createdBy !== userId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: '无权修改此邀请码',
      })
    }

    if (dto.maxUses !== undefined) {
      inviteCode.maxUses = dto.maxUses
    }

    if (dto.expiresAt !== undefined) {
      inviteCode.expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null
    }

    const saved = await this.inviteCodeRepository.save(inviteCode)
    this.logger.log(`Invite code updated: ${id}`)

    return saved
  }

  /**
   * 禁用邀请码
   * POST /api/invite-codes/:id/disable
   */
  async disable(id: string, userId: string): Promise<InviteCode> {
    const inviteCode = await this.inviteCodeRepository.findOne({
      where: { id },
    })

    if (!inviteCode) {
      throw new NotFoundException({
        code: 'CODE_NOT_FOUND',
        message: '邀请码不存在',
      })
    }

    // 只有创建者可以禁用
    if (inviteCode.createdBy !== userId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: '无权禁用此邀请码',
      })
    }

    inviteCode.status = InviteCodeStatus.DISABLED
    const saved = await this.inviteCodeRepository.save(inviteCode)
    this.logger.log(`Invite code disabled: ${id}`)

    return saved
  }

  /**
   * 启用邀请码
   * POST /api/invite-codes/:id/enable
   */
  async enable(id: string, userId: string): Promise<InviteCode> {
    const inviteCode = await this.inviteCodeRepository.findOne({
      where: { id },
    })

    if (!inviteCode) {
      throw new NotFoundException({
        code: 'CODE_NOT_FOUND',
        message: '邀请码不存在',
      })
    }

    // 只有创建者可以启用
    if (inviteCode.createdBy !== userId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: '无权启用此邀请码',
      })
    }

    // 检查是否过期
    if (inviteCode.expiresAt && new Date() > inviteCode.expiresAt) {
      throw new BadRequestException({
        code: 'CODE_EXPIRED',
        message: '邀请码已过期，无法启用',
      })
    }

    // 检查是否达到最大使用次数
    if (inviteCode.usedCount >= inviteCode.maxUses) {
      throw new BadRequestException({
        code: 'CODE_EXHAUSTED',
        message: '邀请码已达到最大使用次数，无法启用',
      })
    }

    inviteCode.status = InviteCodeStatus.ACTIVE
    const saved = await this.inviteCodeRepository.save(inviteCode)
    this.logger.log(`Invite code enabled: ${id}`)

    return saved
  }

  /**
   * 删除邀请码
   * DELETE /api/invite-codes/:id
   */
  async remove(id: string, userId: string): Promise<void> {
    const inviteCode = await this.inviteCodeRepository.findOne({
      where: { id },
    })

    if (!inviteCode) {
      throw new NotFoundException({
        code: 'CODE_NOT_FOUND',
        message: '邀请码不存在',
      })
    }

    // 只有创建者可以删除
    if (inviteCode.createdBy !== userId) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: '无权删除此邀请码',
      })
    }

    await this.inviteCodeRepository.remove(inviteCode)
    this.logger.log(`Invite code deleted: ${id}`)
  }

  /**
   * 获取用户创建的邀请码列表
   * GET /api/invite-codes/my
   */
  async findByCreator(userId: string): Promise<InviteCode[]> {
    return this.inviteCodeRepository.find({
      where: { createdBy: userId },
      relations: ['group'],
      order: { createdAt: 'DESC' },
    })
  }
}
