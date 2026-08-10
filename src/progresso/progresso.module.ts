import { Module } from '@nestjs/common';
import { ProgressoService } from './progresso.service';
import { ProgressoController } from './progresso.controller';

@Module({
  controllers: [ProgressoController],
  providers: [ProgressoService],
})
export class ProgressoModule {}
