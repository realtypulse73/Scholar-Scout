import { IsString } from 'class-validator';

export class CreateNotificationDto {
  @IsString()
  userId!: string;

  @IsString()
  channel!: string;

  @IsString()
  title!: string;

  @IsString()
  body!: string;
}
