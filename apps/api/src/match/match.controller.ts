import { Body, Controller, Post } from '@nestjs/common';

import { MatchRequestDto } from './dto/match-request.dto';
import { MatchService } from './match.service';

@Controller('match')
export class MatchController {
  constructor(private readonly matchService: MatchService) {}

  @Post()
  findMatches(@Body() dto: MatchRequestDto) {
    return this.matchService.findMatches(dto);
  }
}

