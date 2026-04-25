import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { CurrentUserId } from '../auth/current-user.decorator';
import { HeaderUserGuard } from '../auth/header-user.guard';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get(':userId')
  @UseGuards(HeaderUserGuard)
  findByUser(
    @Param('userId') userId: string,
    @CurrentUserId() currentUserId: string,
  ) {
    if (userId !== currentUserId) {
      throw new ForbiddenException('Cannot read another user notifications.');
    }

    return this.notificationsService.findByUser(userId);
  }

  @Post()
  create(@Body() dto: CreateNotificationDto) {
    return this.notificationsService.create(dto);
  }

  @Patch(':id/read')
  @UseGuards(HeaderUserGuard)
  markRead(@Param('id') id: string, @CurrentUserId() currentUserId: string) {
    return this.notificationsService.markRead(id, currentUserId);
  }
}
