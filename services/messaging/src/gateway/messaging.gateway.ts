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
export class MessagingGateway {
  @WebSocketServer()
  server!: Server;

  @SubscribeMessage('message.send')
  handleMessage(@MessageBody() payload: { conversationId: string; body: string }) {
    this.server.emit('message.received', {
      ...payload,
      createdAt: new Date().toISOString(),
    });

    return { ok: true };
  }

  notifyUser(userId: string, title: string, body: string) {
    this.server.emit(`notifications:${userId}`, {
      title,
      body,
      createdAt: new Date().toISOString(),
    });
  }
}

