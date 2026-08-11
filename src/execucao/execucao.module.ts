import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { TarefasModule } from '../tarefas/tarefas.module';
import { ProgressoModule } from '../progresso/progresso.module';
import { ExecucaoController } from './execucao.controller';
import { ExecucaoService } from './execucao.service';

@Module({
  imports: [UsersModule, TarefasModule, ProgressoModule],
  controllers: [ExecucaoController],
  providers: [ExecucaoService],
})
export class ExecucaoModule {}
