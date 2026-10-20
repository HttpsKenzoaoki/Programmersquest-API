import { Controller, Get, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('ranking')
export class RankingController {
  constructor(private readonly usersService: UsersService) {}

  @Public()
  @Get()
  findRanking(@Query('turmaId') turmaId?: string) {
    return this.usersService.findRanking(turmaId);
  }
}
