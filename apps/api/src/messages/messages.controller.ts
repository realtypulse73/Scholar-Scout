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
import { CreateConversationDto } from './dto/create-conversation.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessagesService } from './messages.service';

@Controller('messages')
@UseGuards(HeaderUserGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('conversations/:userId')
  findConversations(
    @Param('userId') userId: string,
    @CurrentUserId() currentUserId: string,
  ) {
    if (userId !== currentUserId) {
      throw new ForbiddenException('Cannot read another user inbox.');
    }

    return this.messagesService.findConversationsForUser(userId);
  }

  @Post('conversations')
  createConversation(
    @Body() dto: CreateConversationDto,
    @CurrentUserId() currentUserId: string,
  ) {
    return this.messagesService.createConversation(dto, currentUserId);
  }

  @Post()
  createMessage(
    @Body() dto: CreateMessageDto,
    @CurrentUserId() currentUserId: string,
  ) {
    return this.messagesService.createMessage(dto, currentUserId);
  }

  @Patch(':id/read')
  markMessageRead(
    @Param('id') id: string,
    @CurrentUserId() currentUserId: string,
  ) {
    return this.messagesService.markMessageRead(id, currentUserId);
  }
}
