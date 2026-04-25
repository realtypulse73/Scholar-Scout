import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  createConversation(dto: CreateConversationDto, currentUserId: string) {
    const participantIds = [...new Set(dto.participantIds)];

    if (participantIds.length < 2) {
      throw new BadRequestException(
        'A conversation requires at least two unique participants.',
      );
    }

    if (!participantIds.includes(currentUserId)) {
      throw new ForbiddenException('Cannot create conversations for other users.');
    }

    return this.prisma.conversation.create({
      data: {
        participantIds,
      },
      include: {
        messages: true,
      },
    });
  }

  findConversationsForUser(userId: string) {
    return this.prisma.conversation.findMany({
      where: {
        participantIds: {
          has: userId,
        },
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async createMessage(dto: CreateMessageDto, currentUserId: string) {
    if (dto.senderId !== currentUserId) {
      throw new ForbiddenException('Cannot send messages as another user.');
    }

    const conversation = await this.prisma.conversation.findUnique({
      where: { id: dto.conversationId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found.');
    }

    if (!conversation.participantIds.includes(currentUserId)) {
      throw new ForbiddenException('Cannot write to another user conversation.');
    }

    const message = await this.prisma.message.create({
      data: dto,
    });

    await this.prisma.conversation.update({
      where: { id: dto.conversationId },
      data: { updatedAt: new Date() },
    });

    for (const participantId of conversation.participantIds) {
      this.realtimeGateway.emitInboxMessage(participantId, {
        id: message.id,
          conversationId: dto.conversationId,
          senderId: dto.senderId,
          body: dto.body,
          createdAt: message.createdAt,
        });
      }

    return message;
  }

  async markMessageRead(id: string, currentUserId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id },
      include: { conversation: true },
    });

    if (!message) {
      throw new NotFoundException('Message not found.');
    }

    if (!message.conversation.participantIds.includes(currentUserId)) {
      throw new ForbiddenException('Cannot update another user message.');
    }

    return this.prisma.message.update({
      where: { id },
      data: { readAt: new Date() },
    });
  }
}
