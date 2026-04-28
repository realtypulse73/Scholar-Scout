import {
  IsArray,
  IsNumber,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpsertStudentProfileDto {
  @IsString()
  userId!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(4)
  gpa!: number;

  @IsArray()
  @IsString({ each: true })
  interests!: string[];

  @IsString()
  location!: string;
}
