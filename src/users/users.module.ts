import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { RankingController } from './ranking.controller';

@Module({
  controllers: [UsersController, RankingController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
