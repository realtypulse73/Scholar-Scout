import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

type TimestampedEvent = {
  createdAt?: Date | string;
};

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

  emitNotification(
    userId: string,
    event: { id: string; title: string; body: string } & TimestampedEvent,
  ) {
    this.server.emit(`notifications:${userId}`, {
      ...event,
      createdAt: event.createdAt ?? new Date().toISOString(),
    });
  }

  emitInboxMessage(
    userId: string,
    event: {
      id: string;
      conversationId: string;
      body: string;
      senderId: string;
    } & TimestampedEvent,
  ) {
    this.server.emit(`inbox:${userId}`, {
      ...event,
      createdAt: event.createdAt ?? new Date().toISOString(),
    });
  }
}
