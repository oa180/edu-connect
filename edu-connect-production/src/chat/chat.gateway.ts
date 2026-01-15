import { UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway {
  @WebSocketServer()
  server!: Server;

  constructor(private jwt: JwtService, private chat: ChatService) {}

  handleConnection = async (client: Socket) => {
    try {
      const token = this.extractToken(client);
      const payload = await this.jwt.verifyAsync(token, { secret: process.env.JWT_ACCESS_SECRET });
      client.data.userId = payload.sub;
      // Auto join private room for direct messages
      client.join(`user:${payload.sub}`);
    } catch (e) {
      client.disconnect(true);
    }
  };

  private extractToken(client: Socket): string {
    const fromQuery = client.handshake.auth?.token || client.handshake.query?.token;
    if (typeof fromQuery === 'string' && fromQuery) return fromQuery;
    const authHeader = client.handshake.headers['authorization'];
    if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    throw new Error('No auth token');
  }

  @SubscribeMessage('joinGroup')
  async onJoinGroup(@ConnectedSocket() client: Socket, @MessageBody() data: { groupId: string }) {
    const userId = client.data.userId as string;
    await this.chat.getGroupMessages(userId, data.groupId, 1, 1); // authorization check
    client.join(`group:${data.groupId}`);
    client.emit('joinedGroup', { groupId: data.groupId });
  }

  @SubscribeMessage('sendMessage')
  async onSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { content: string; receiverId?: string; groupId?: string },
  ) {
    const senderId = client.data.userId as string;
    let message;
    if (data.receiverId) {
      message = await this.chat.sendPrivateMessage(senderId, data.receiverId, data.content);
      this.server.to(`user:${senderId}`).to(`user:${data.receiverId}`).emit('receiveMessage', message);
    } else if (data.groupId) {
      message = await this.chat.sendGroupMessage(senderId, data.groupId, data.content);
      this.server.to(`group:${data.groupId}`).emit('receiveMessage', message);
    } else {
      throw new Error('receiverId or groupId is required');
    }
    return message;
  }

  @SubscribeMessage('markPrivateRead')
  async onMarkPrivateRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { otherUserId: string },
  ) {
    const userId = client.data.userId as string;
    await this.chat.markPrivateRead(userId, data.otherUserId);
    this.server.to(`user:${userId}`).emit('privateRead', { otherUserId: data.otherUserId });
  }

  @SubscribeMessage('markGroupRead')
  async onMarkGroupRead(@ConnectedSocket() client: Socket, @MessageBody() data: { groupId: string }) {
    const userId = client.data.userId as string;
    await this.chat.markGroupRead(userId, data.groupId);
    this.server.to(`group:${data.groupId}`).emit('groupRead', { groupId: data.groupId });
  }
}
