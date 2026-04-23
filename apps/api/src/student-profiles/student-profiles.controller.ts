import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { UpsertStudentProfileDto } from './dto/upsert-student-profile.dto';
import { StudentProfilesService } from './student-profiles.service';

@Controller('student-profiles')
export class StudentProfilesController {
  constructor(
    private readonly studentProfilesService: StudentProfilesService,
  ) {}

  @Post()
  upsert(@Body() dto: UpsertStudentProfileDto) {
    return this.studentProfilesService.upsert(dto);
  }

  @Get('user/:userId')
  findByUserId(@Param('userId') userId: string) {
    return this.studentProfilesService.findByUserId(userId);
  }
}
