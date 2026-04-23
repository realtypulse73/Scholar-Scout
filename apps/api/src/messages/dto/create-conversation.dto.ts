import { ArrayMinSize, IsArray, IsString } from 'class-validator';

export class CreateConversationDto {
  @IsArray()
  @ArrayMinSize(2)
  @IsString({ each: true })
  participantIds!: string[];
}

