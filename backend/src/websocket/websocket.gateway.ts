import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { RawData, Server as WsServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { User, UserStatus } from '../users/entities/user.entity';
import { Extension } from '../extensions/entities/extension.entity';

interface ActiveCall {
  callerUserId: string;
  calleeUserId: string;
  callerExtension: string;
  calleeExtension: string;
}

@WebSocketGateway({ path: '/ws' })
export class WebsocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: WsServer;

  private readonly logger = new Logger(WebsocketGateway.name);

  // userId → Set<socketId>
  private userSockets = new Map<string, Set<string>>();
  // socketId → userId
  private socketUsers = new Map<string, string>();
  // socketId → WebSocket reference
  private socketRefs = new Map<string, WebSocket>();
  // userId → extensionNumber (cached on connect)
  private userExtensions = new Map<string, string>();
  // callId → ActiveCall session
  private activeCalls = new Map<string, ActiveCall>();

  private counter = 0;

  constructor(
    private jwtService: JwtService,
    private config: ConfigService,
    @InjectRepository(User)
    private usersRepo: Repository<User>,
    @InjectRepository(Extension)
    private extensionsRepo: Repository<Extension>,
  ) {}

  afterInit() {
    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(client: WebSocket, request: IncomingMessage) {
    try {
      const url = new URL(request.url ?? '/', 'http://localhost');
      const token =
        url.searchParams.get('token') ??
        (request.headers.authorization ?? '').replace('Bearer ', '');

      if (!token) {
        client.close(1008, 'No token');
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: this.config.get<string>('JWT_SECRET'),
      });

      const user = await this.usersRepo.findOne({
        where: { id: payload.sub },
        relations: ['extension'],
      });
      if (!user) {
        client.close(1008, 'User not found');
        return;
      }

      const socketId = `ws-${++this.counter}`;
      (client as any)._socketId = socketId;

      this.socketUsers.set(socketId, user.id);
      this.socketRefs.set(socketId, client);
      if (!this.userSockets.has(user.id)) {
        this.userSockets.set(user.id, new Set());
      }
      this.userSockets.get(user.id).add(socketId);

      if (user.extension?.extensionNumber) {
        this.userExtensions.set(user.id, user.extension.extensionNumber);
      }

      await this.usersRepo.update(user.id, { status: UserStatus.ONLINE });
      this.broadcastAll('user.online', { userId: user.id });

      // Route incoming messages from this client
      client.on('message', (data: RawData) => {
        this.handleClientMessage(socketId, this.rawDataToString(data)).catch(
          (err) => this.logger.warn(`WS message error: ${err.message}`),
        );
      });

      this.logger.log(`WS connected: ${user.username} (${socketId})`);
    } catch {
      client.close(1008, 'Auth failed');
    }
  }

  async handleDisconnect(client: WebSocket) {
    const socketId = (client as any)._socketId as string | undefined;
    if (!socketId) return;

    const userId = this.socketUsers.get(socketId);
    this.socketUsers.delete(socketId);
    this.socketRefs.delete(socketId);

    if (userId) {
      const sockets = this.userSockets.get(userId);
      if (sockets) {
        sockets.delete(socketId);
        if (sockets.size === 0) {
          this.userSockets.delete(userId);
          this.userExtensions.delete(userId);
          await this.usersRepo.update(userId, { status: UserStatus.OFFLINE });
          this.broadcastAll('user.offline', { userId });
          this.logger.log(`WS offline: ${userId}`);
        }
      }
    }
  }

  // ─── Incoming message router ───────────────────────────────────────────────

  private async handleClientMessage(socketId: string, rawData: string) {
    let msg: any;
    try {
      msg = JSON.parse(rawData);
    } catch {
      return;
    }

    const userId = this.socketUsers.get(socketId);
    if (!userId) return;

    switch (msg.type) {
      case 'call.invite':
        await this.onCallInvite(
          userId,
          msg.toExtension as string,
          msg.callId as string | undefined,
        );
        break;
      case 'call.accept':
        await this.onCallAccept(userId, msg.callId as string);
        break;
      case 'call.reject':
        await this.onCallReject(userId, msg.callId as string);
        break;
      case 'call.offer':
        this.onCallOffer(userId, msg.callId as string, msg.sdp as string);
        break;
      case 'call.answer':
        this.onCallAnswer(userId, msg.callId as string, msg.sdp as string);
        break;
      case 'call.ice':
        this.onCallIce(userId, msg.callId as string, msg.candidate);
        break;
      case 'call.hangup':
        await this.onCallHangup(userId, msg.callId as string);
        break;
    }
  }

  // ─── Signaling handlers ────────────────────────────────────────────────────

  private async onCallInvite(
    callerUserId: string,
    toExtension: string,
    requestedCallId?: string,
  ) {
    if (!toExtension) return;

    const extension = await this.extensionsRepo.findOne({
      where: { extensionNumber: toExtension },
    });

    if (!extension?.userId) {
      this.sendToUser(callerUserId, 'call.failed', {
        reason: 'Extension not found',
      });
      return;
    }

    if (!extension.allowIncomingCalls) {
      this.sendToUser(callerUserId, 'call.failed', {
        reason: 'Extension does not accept calls',
      });
      return;
    }

    const calleeUserId = extension.userId;
    if (!this.userSockets.has(calleeUserId)) {
      this.sendToUser(callerUserId, 'call.failed', { reason: 'User offline' });
      return;
    }

    const callerExtension = this.userExtensions.get(callerUserId) ?? '';
    const callerUser = await this.usersRepo.findOne({
      where: { id: callerUserId },
    });

    const callId =
      requestedCallId &&
      requestedCallId.length <= 100 &&
      !this.activeCalls.has(requestedCallId)
        ? requestedCallId
        : uuidv4();
    this.activeCalls.set(callId, {
      callerUserId,
      calleeUserId,
      callerExtension,
      calleeExtension: toExtension,
    });

    const callerName = callerUser
      ? `${callerUser.firstName} ${callerUser.lastName}`.trim()
      : callerExtension;

    // Notify callee
    this.sendToUser(calleeUserId, 'call.incoming', {
      callId,
      fromExtension: callerExtension,
      fromName: callerName,
    });

    // Acknowledge caller that phone is ringing
    this.sendToUser(callerUserId, 'call.ringing', {
      callId,
      toExtension,
    });

    this.logger.log(
      `Call invite: ${callerExtension} → ${toExtension} [${callId}]`,
    );
  }

  private async onCallAccept(calleeUserId: string, callId: string) {
    const session = this.activeCalls.get(callId);
    if (!session || session.calleeUserId !== calleeUserId) return;

    // Notify caller that callee accepted — caller must now send SDP offer
    this.sendToUser(session.callerUserId, 'call.accepted', { callId });

    await this.usersRepo.update(calleeUserId, { status: UserStatus.IN_CALL });
    await this.usersRepo.update(session.callerUserId, {
      status: UserStatus.IN_CALL,
    });

    this.logger.log(`Call accepted: [${callId}]`);
  }

  private async onCallReject(calleeUserId: string, callId: string) {
    const session = this.activeCalls.get(callId);
    if (!session) return;

    this.sendToUser(session.callerUserId, 'call.rejected', { callId });
    this.activeCalls.delete(callId);

    this.logger.log(`Call rejected: [${callId}]`);
  }

  private onCallOffer(callerUserId: string, callId: string, sdp: string) {
    const session = this.activeCalls.get(callId);
    if (!session || session.callerUserId !== callerUserId || !sdp) return;
    // Relay SDP offer to callee
    this.sendToUser(session.calleeUserId, 'call.offer', { callId, sdp });
  }

  private onCallAnswer(calleeUserId: string, callId: string, sdp: string) {
    const session = this.activeCalls.get(callId);
    if (!session || session.calleeUserId !== calleeUserId || !sdp) return;
    // Relay SDP answer to caller
    this.sendToUser(session.callerUserId, 'call.answer', { callId, sdp });
  }

  private onCallIce(userId: string, callId: string, candidate: any) {
    const session = this.activeCalls.get(callId);
    if (!session || !candidate) return;

    const targetUserId =
      session.callerUserId === userId
        ? session.calleeUserId
        : session.callerUserId;

    this.sendToUser(targetUserId, 'call.ice', { callId, candidate });
  }

  private async onCallHangup(userId: string, callId: string) {
    const session = this.activeCalls.get(callId);
    if (!session) return;

    const otherUserId =
      session.callerUserId === userId
        ? session.calleeUserId
        : session.callerUserId;

    this.sendToUser(otherUserId, 'call.hangup', { callId });
    this.activeCalls.delete(callId);

    await this.usersRepo.update(userId, { status: UserStatus.ONLINE });
    await this.usersRepo.update(otherUserId, { status: UserStatus.ONLINE });

    this.logger.log(`Call ended: [${callId}]`);
  }

  // ─── Internal helpers ──────────────────────────────────────────────────────

  private broadcastAll(type: string, data: object) {
    const msg = JSON.stringify({ type, ...data });
    this.server.clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) ws.send(msg);
    });
  }

  private sendToUser(userId: string, type: string, data: object) {
    const msg = JSON.stringify({ type, ...data });
    this.userSockets.get(userId)?.forEach((sid) => {
      const ws = this.socketRefs.get(sid);
      if (ws?.readyState === WebSocket.OPEN) ws.send(msg);
    });
  }

  // ─── Emit helpers (called by other services) ──────────────────────────────

  emitUserOnline(userId: string) {
    this.broadcastAll('user.online', { userId });
  }

  emitUserOffline(userId: string) {
    this.broadcastAll('user.offline', { userId });
  }

  emitUserBusy(userId: string) {
    this.broadcastAll('user.busy', { userId });
  }

  emitCallRinging(
    callerUserId: string,
    calleeUserId: string,
    extension: string,
  ) {
    this.sendToUser(calleeUserId, 'call.ringing', { callerUserId, extension });
  }

  emitCallEnded(userId: string, callId: string) {
    this.sendToUser(userId, 'call.ended', { callId });
  }

  emitDeviceRevoked(userId: string, deviceId: string) {
    this.sendToUser(userId, 'device.revoked', { deviceId });
  }

  emitExtensionUpdated(userId: string, extensionNumber: string) {
    this.sendToUser(userId, 'extension.updated', { extensionNumber });
  }

  emitToAll(event: string, data: object) {
    this.broadcastAll(event, data);
  }

  getOnlineUserIds(): string[] {
    return Array.from(this.userSockets.keys());
  }

  private rawDataToString(data: RawData): string {
    if (typeof data === 'string') return data;
    if (Buffer.isBuffer(data)) return data.toString('utf8');
    if (Array.isArray(data)) return Buffer.concat(data).toString('utf8');
    return Buffer.from(data).toString('utf8');
  }
}
