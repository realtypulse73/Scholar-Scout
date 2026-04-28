import { IsString } from 'class-validator';

export class CreateMessageDto {
  @IsString()
  conversationId!: string;

  @IsString()
  senderId!: string;

  @IsString()
  body!: string;
}

