import { BadRequestException, ForbiddenException } from '@nestjs/common';

import { MessagesService } from './messages.service';

describe('MessagesService', () => {
  const prisma = {
    conversation: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    message: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };
  const realtimeGateway = {
    emitInboxMessage: jest.fn(),
  };
  const service = new MessagesService(prisma as never, realtimeGateway as never);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('requires at least two unique conversation participants', () => {
    expect(() =>
      service.createConversation({ participantIds: ['user_1', 'user_1'] }, 'user_1'),
    ).toThrow(BadRequestException);
  });

  it('prevents creating a conversation for another user', () => {
    expect(() =>
      service.createConversation(
        { participantIds: ['user_2', 'support'] },
        'user_1',
      ),
    ).toThrow(ForbiddenException);
  });

  it('prevents sending as another user', async () => {
    await expect(
      service.createMessage(
        { conversationId: 'conversation_1', senderId: 'user_2', body: 'Hi' },
        'user_1',
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('prevents sending into conversations the user does not belong to', async () => {
    prisma.conversation.findUnique.mockResolvedValue({
      id: 'conversation_1',
      participantIds: ['user_2', 'support'],
    });

    await expect(
      service.createMessage(
        { conversationId: 'conversation_1', senderId: 'user_1', body: 'Hi' },
        'user_1',
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('emits inbox events to conversation participants when creating a message', async () => {
    prisma.conversation.findUnique.mockResolvedValue({
      id: 'conversation_1',
      participantIds: ['user_1', 'support'],
    });
    prisma.message.create.mockResolvedValue({
      id: 'message_1',
      conversationId: 'conversation_1',
      senderId: 'user_1',
      body: 'Hello',
      createdAt: new Date('2026-04-23T00:00:00.000Z'),
    });
    prisma.conversation.update.mockResolvedValue({});

    await service.createMessage(
      { conversationId: 'conversation_1', senderId: 'user_1', body: 'Hello' },
      'user_1',
    );

    expect(realtimeGateway.emitInboxMessage).toHaveBeenCalledTimes(2);
    expect(realtimeGateway.emitInboxMessage).toHaveBeenCalledWith('support', {
      id: 'message_1',
      conversationId: 'conversation_1',
      senderId: 'user_1',
      body: 'Hello',
      createdAt: new Date('2026-04-23T00:00:00.000Z'),
    });
  });

  it('prevents marking another user message as read', async () => {
    prisma.message.findUnique.mockResolvedValue({
      id: 'message_1',
      conversation: { participantIds: ['user_2', 'support'] },
    });

    await expect(
      service.markMessageRead('message_1', 'user_1'),
    ).rejects.toThrow(ForbiddenException);
  });
});
