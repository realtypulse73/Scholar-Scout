import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  async create(dto: CreateNotificationDto) {
    const notification = await this.prisma.notification.create({
      data: dto,
    });

    this.realtimeGateway.emitNotification(dto.userId, {
      id: notification.id,
      title: dto.title,
      body: dto.body,
    });

    return notification;
  }

  findByUser(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markRead(id: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found.');
    }

    return this.prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
  }
}
