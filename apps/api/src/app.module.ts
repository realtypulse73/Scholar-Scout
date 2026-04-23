import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { MatchModule } from './match/match.module';
import { MessagesModule } from './messages/messages.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProgramsModule } from './programs/programs.module';
import { RealtimeModule } from './realtime/realtime.module';
import { StudentProfilesModule } from './student-profiles/student-profiles.module';
import { UsersModule } from './users/users.module';
import { AppController } from './common/app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    RealtimeModule,
    UsersModule,
    StudentProfilesModule,
    ProgramsModule,
    MatchModule,
    NotificationsModule,
    MessagesModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
