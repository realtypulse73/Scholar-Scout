import { Body, Controller, Get, Post } from '@nestjs/common';

import { CreateProgramDto } from './dto/create-program.dto';
import { ProgramsService } from './programs.service';

@Controller('programs')
export class ProgramsController {
  constructor(private readonly programsService: ProgramsService) {}

  @Get()
  findAll() {
    return this.programsService.findAll();
  }

  @Post()
  create(@Body() dto: CreateProgramDto) {
    return this.programsService.create(dto);
  }
}

