import { Module } from '@nestjs/common';

import { ProgramsModule } from '../programs/programs.module';
import { StudentProfilesModule } from '../student-profiles/student-profiles.module';
import { MatchController } from './match.controller';
import { MatchService } from './match.service';

@Module({
  imports: [StudentProfilesModule, ProgramsModule],
  controllers: [MatchController],
  providers: [MatchService],
})
export class MatchModule {}

