import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';

import { CreateConversationDto } from './dto/create-conversation.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessagesService } from './messages.service';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('conversations/:userId')
  findConversations(@Param('userId') userId: string) {
    return this.messagesService.findConversationsForUser(userId);
  }

  @Post('conversations')
  createConversation(@Body() dto: CreateConversationDto) {
    return this.messagesService.createConversation(dto);
  }

  @Post()
  createMessage(@Body() dto: CreateMessageDto) {
    return this.messagesService.createMessage(dto);
  }

  @Patch(':id/read')
  markMessageRead(@Param('id') id: string) {
    return this.messagesService.markMessageRead(id);
  }
}
