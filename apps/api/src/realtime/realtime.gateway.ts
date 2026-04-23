import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class RealtimeGateway {
  @WebSocketServer()
  server!: Server;

  @SubscribeMessage('inbox.send')
  handleInboxSend(
    @MessageBody() payload: { userId: string; conversationId: string; body: string },
  ) {
    this.server.emit(`inbox:${payload.userId}`, {
      ...payload,
      createdAt: new Date().toISOString(),
    });

    return { delivered: true };
  }

  emitNotification(userId: string, event: { id: string; title: string; body: string }) {
    this.server.emit(`notifications:${userId}`, {
      ...event,
      createdAt: new Date().toISOString(),
    });
  }

  emitInboxMessage(
    userId: string,
    event: { id: string; conversationId: string; body: string; senderId: string },
  ) {
    this.server.emit(`inbox:${userId}`, {
      ...event,
      createdAt: new Date().toISOString(),
    });
  }
}
