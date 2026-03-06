import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
  WsException,
} from '@nestjs/websockets';
import { Logger, UseFilters, Inject, forwardRef, ArgumentsHost } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { RoundTable, RoundTableStatus } from '../entities/roundtable.entity';
import {
  RoundTableParticipant,
  ParticipantStatus,
} from '../entities/roundtable-participant.entity';
import { ChatMessage, MessageType } from '../entities/chat-message.entity';
import { User } from '../../user/entities/user.entity';
import { RoundTableService } from '../roundtable.service';

/**
 * WebSocket 异常过滤器
 */
class WsExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const client = host.switchToWs().getClient() as Socket;
    const error = exception instanceof WsException
      ? exception.getError()
      : { code: 'INTERNAL_ERROR', message: 'Internal server error' };

    client.emit('error', error);
  }
}

/**
 * 消息数据接口
 */
interface MessageData {
  content: string;
  contentType: 'text' | 'image';
}

/**
 * 用户状态数据接口
 */
interface UserStatusData {
  status: 'speaking' | 'idle' | 'typing';
}

/**
 * 圆桌 WebSocket Gateway
 * 处理圆桌讨论的实时通信
 */
@WebSocketGateway({
  namespace: '/round-tables',
  cors: {
    origin: '*',
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
@UseFilters(new WsExceptionFilter())
export class RoundTableGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RoundTableGateway.name);

  // 存储 socket -> 用户信息的映射
  private socketUserMap: Map<string, { userId: string; roundTableId: string }> = new Map();

  // 存储圆桌房间内的用户
  private roundTableRooms: Map<string, Set<string>> = new Map();

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectRepository(RoundTable)
    private roundTableRepository: Repository<RoundTable>,
    @InjectRepository(RoundTableParticipant)
    private participantRepository: Repository<RoundTableParticipant>,
    @InjectRepository(ChatMessage)
    private chatMessageRepository: Repository<ChatMessage>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @Inject(forwardRef(() => RoundTableService))
    private roundTableService: RoundTableService,
  ) {}

  /**
   * 处理客户端连接
   */
  async handleConnection(client: Socket): Promise<void> {
    try {
      // 从查询参数或认证信息中获取 token
      const token = client.handshake.auth?.token || client.handshake.query?.token;

      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token`);
        client.emit('error', { code: 'UNAUTHORIZED', message: '未提供认证令牌' });
        client.disconnect();
        return;
      }

      // 验证 JWT Token
      let payload: any;
      try {
        payload = await this.jwtService.verifyAsync(token, {
          secret: this.configService.get<string>('JWT_SECRET'),
        });
      } catch (error) {
        this.logger.warn(`Invalid token for client ${client.id}`);
        client.emit('error', { code: 'INVALID_TOKEN', message: '无效的认证令牌' });
        client.disconnect();
        return;
      }

      // 从 URL 或查询参数中获取圆桌 ID
      // URL 格式: /round-tables/:id/ws
      const roundTableId = this.extractRoundTableId(client);

      if (!roundTableId) {
        this.logger.warn(`Client ${client.id} connected without roundTableId`);
        client.emit('error', { code: 'MISSING_ROUNDTABLE_ID', message: '缺少圆桌ID' });
        client.disconnect();
        return;
      }

      // 检查圆桌是否存在
      const roundTable = await this.roundTableRepository.findOne({
        where: { id: roundTableId },
      });

      if (!roundTable) {
        client.emit('error', { code: 'ROUNDTABLE_NOT_FOUND', message: '圆桌不存在' });
        client.disconnect();
        return;
      }

      // 检查用户是否是圆桌参与者
      const participant = await this.participantRepository.findOne({
        where: {
          roundTableId,
          userId: payload.sub,
          status: In([ParticipantStatus.MATCHED, ParticipantStatus.JOINED]),
        },
      });

      if (!participant) {
        client.emit('error', { code: 'NOT_PARTICIPANT', message: '您不是该圆桌的参与者' });
        client.disconnect();
        return;
      }

      // 获取用户信息
      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user) {
        client.emit('error', { code: 'USER_NOT_FOUND', message: '用户不存在' });
        client.disconnect();
        return;
      }

      // 更新参与者状态为已加入
      if (participant.status === ParticipantStatus.MATCHED) {
        participant.status = ParticipantStatus.JOINED;
        participant.joinedAt = new Date();
        await this.participantRepository.save(participant);
      }

      // 存储用户信息
      this.socketUserMap.set(client.id, { userId: payload.sub, roundTableId });

      // 加入房间
      client.join(`roundtable:${roundTableId}`);

      // 记录房间用户
      if (!this.roundTableRooms.has(roundTableId)) {
        this.roundTableRooms.set(roundTableId, new Set());
      }
      this.roundTableRooms.get(roundTableId)!.add(payload.sub);

      // 获取所有参与者
      const participants = await this.getParticipants(roundTableId);

      // 发送连接成功事件
      client.emit('connected', {
        roundTableId,
        userId: payload.sub,
        participants,
      });

      // 通知其他用户有人加入
      client.to(`roundtable:${roundTableId}`).emit('user_joined', {
        user: {
          userId: user.id,
          nickname: user.nickname || '匿名用户',
          avatar: user.avatar,
          joinedAt: participant.joinedAt?.toISOString() || new Date().toISOString(),
          role: participant.role,
        },
      });

      this.logger.log(`User ${payload.sub} connected to roundtable ${roundTableId}`);
    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`);
      client.emit('error', { code: 'CONNECTION_ERROR', message: '连接错误' });
      client.disconnect();
    }
  }

  /**
   * 处理客户端断开连接
   */
  async handleDisconnect(client: Socket): Promise<void> {
    const userInfo = this.socketUserMap.get(client.id);

    if (userInfo) {
      const { userId, roundTableId } = userInfo;

      // 从房间移除用户
      const roomUsers = this.roundTableRooms.get(roundTableId);
      if (roomUsers) {
        roomUsers.delete(userId);
        if (roomUsers.size === 0) {
          this.roundTableRooms.delete(roundTableId);
        }
      }

      // 通知其他用户有人离开
      this.server.to(`roundtable:${roundTableId}`).emit('user_left', {
        userId,
      });

      this.logger.log(`User ${userId} disconnected from roundtable ${roundTableId}`);
    }

    this.socketUserMap.delete(client.id);
  }

  /**
   * 处理发送消息
   */
  @SubscribeMessage('send_message')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: MessageData,
  ): Promise<void> {
    const userInfo = this.socketUserMap.get(client.id);

    if (!userInfo) {
      throw new WsException({ code: 'NOT_CONNECTED', message: '未连接到圆桌' });
    }

    const { userId, roundTableId } = userInfo;

    // 获取用户信息
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new WsException({ code: 'USER_NOT_FOUND', message: '用户不存在' });
    }

    // 创建消息记录
    const message = this.chatMessageRepository.create({
      roundTableId,
      userId,
      content: data.content,
      messageType: data.contentType === 'image' ? MessageType.IMAGE : MessageType.TEXT,
    });

    await this.chatMessageRepository.save(message);

    // 构建消息响应
    const messageResponse = {
      id: message.id,
      userId,
      nickname: user.nickname || '匿名用户',
      content: data.content,
      contentType: data.contentType,
      createdAt: message.createdAt.toISOString(),
    };

    // 广播消息给房间内所有用户
    this.server.to(`roundtable:${roundTableId}`).emit('receive_message', messageResponse);

    this.logger.log(`Message sent by ${userId} in roundtable ${roundTableId}`);
  }

  /**
   * 处理用户状态更新
   */
  @SubscribeMessage('user_status')
  async handleUserStatus(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: UserStatusData,
  ): Promise<void> {
    const userInfo = this.socketUserMap.get(client.id);

    if (!userInfo) {
      return;
    }

    const { userId, roundTableId } = userInfo;

    // 广播用户状态给房间内其他用户
    client.to(`roundtable:${roundTableId}`).emit('user_status', {
      userId,
      status: data.status,
    });
  }

  /**
   * 处理开始说话
   */
  @SubscribeMessage('start_speaking')
  async handleStartSpeaking(@ConnectedSocket() client: Socket): Promise<void> {
    const userInfo = this.socketUserMap.get(client.id);

    if (!userInfo) {
      return;
    }

    const { userId, roundTableId } = userInfo;

    // 广播用户正在说话
    client.to(`roundtable:${roundTableId}`).emit('user_status', {
      userId,
      status: 'speaking',
    });
  }

  /**
   * 处理停止说话
   */
  @SubscribeMessage('stop_speaking')
  async handleStopSpeaking(@ConnectedSocket() client: Socket): Promise<void> {
    const userInfo = this.socketUserMap.get(client.id);

    if (!userInfo) {
      return;
    }

    const { userId, roundTableId } = userInfo;

    // 广播用户停止说话
    client.to(`roundtable:${roundTableId}`).emit('user_status', {
      userId,
      status: 'idle',
    });
  }

  /**
   * 广播圆桌开始事件
   */
  async broadcastRoundTableStart(roundTableId: string, duration: number): Promise<void> {
    this.server.to(`roundtable:${roundTableId}`).emit('round_table_start', {
      startedAt: new Date().toISOString(),
      duration,
    });
  }

  /**
   * 广播圆桌结束事件
   */
  async broadcastRoundTableEnd(
    roundTableId: string,
    duration: number,
    summary: string,
  ): Promise<void> {
    this.server.to(`roundtable:${roundTableId}`).emit('round_table_end', {
      endedAt: new Date().toISOString(),
      duration,
      summary,
    });
  }

  /**
   * 广播进入下一阶段事件
   */
  async broadcastNextPhase(
    roundTableId: string,
    phase: number,
    phaseName: string,
    question?: string,
  ): Promise<void> {
    this.server.to(`roundtable:${roundTableId}`).emit('next_phase', {
      phase,
      phaseName,
      question,
    });
  }

  /**
   * 获取圆桌参与者列表
   */
  private async getParticipants(roundTableId: string): Promise<any[]> {
    const participants = await this.participantRepository.find({
      where: {
        roundTableId,
        status: In([ParticipantStatus.MATCHED, ParticipantStatus.JOINED]),
      },
      relations: ['user'],
    });

    return participants.map((p) => ({
      userId: p.userId,
      nickname: p.user?.nickname || '匿名用户',
      avatar: p.user?.avatar,
      joinedAt: p.joinedAt?.toISOString() || p.createdAt.toISOString(),
      role: p.role,
    }));
  }

  /**
   * 从客户端连接中提取圆桌 ID
   */
  private extractRoundTableId(client: Socket): string | null {
    // 从查询参数获取
    const queryId = client.handshake.query?.roundTableId;
    if (queryId && typeof queryId === 'string') {
      return queryId;
    }

    // 从 URL 中提取
    // URL 格式: /round-tables/:id/ws
    const urlParts = client.request.url?.split('/') || [];
    const wsIndex = urlParts.indexOf('ws');

    if (wsIndex > 0) {
      // ws 前面应该是圆桌 ID
      return urlParts[wsIndex - 1];
    }

    // 尝试从 namespace 中提取
    const namespace = client.nsp?.name || '';
    const match = namespace.match(/\/round-tables\/([^/]+)/);
    if (match) {
      return match[1];
    }

    return null;
  }
}