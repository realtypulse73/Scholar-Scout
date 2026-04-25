import { ForbiddenException } from '@nestjs/common';

import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  const prisma = {
    notification: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };
  const realtimeGateway = {
    emitNotification: jest.fn(),
  };
  const service = new NotificationsService(
    prisma as never,
    realtimeGateway as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('emits realtime notifications when creating a notification', async () => {
    prisma.notification.create.mockResolvedValue({
      id: 'notification_1',
      userId: 'user_1',
      channel: 'in_app',
      title: 'Match update',
      body: 'You have a new match.',
      createdAt: new Date('2026-04-23T00:00:00.000Z'),
    });

    await service.create({
      userId: 'user_1',
      channel: 'in_app',
      title: 'Match update',
      body: 'You have a new match.',
    });

    expect(realtimeGateway.emitNotification).toHaveBeenCalledWith('user_1', {
      id: 'notification_1',
      title: 'Match update',
      body: 'You have a new match.',
      createdAt: new Date('2026-04-23T00:00:00.000Z'),
    });
  });

  it('prevents marking another user notification as read', async () => {
    prisma.notification.findUnique.mockResolvedValue({
      id: 'notification_1',
      userId: 'user_2',
    });

    await expect(
      service.markRead('notification_1', 'user_1'),
    ).rejects.toThrow(ForbiddenException);
  });
});
