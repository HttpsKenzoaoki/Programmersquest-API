import { Body, Controller, Post } from '@nestjs/common';
import { ExecucaoService } from './execucao.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ExecutarTarefaDto } from './dto/executar-tarefa.dto';
import type { AutenticatedUser } from '../auth/auth.types';

@Controller('execucao')
export class ExecucaoController {
  constructor(private readonly execucaoService: ExecucaoService) {}

  @Post()
  executar(
    @Body() dto: ExecutarTarefaDto,
    @CurrentUser() user: AutenticatedUser,
  ) {
    return this.execucaoService.executar(dto, user);
  }
}
