import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { ProgressoService } from './progresso.service';
import { CreateProgressoDto } from './dto/create-progresso.dto';
import { UpdateProgressoDto } from './dto/update-progresso.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Owner } from '../auth/decorators/owner.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AutenticatedUser } from '../auth/auth.types';

@Controller('progresso')
export class ProgressoController {
  constructor(private readonly progressoService: ProgressoService) {}

  // Aluno só cria progresso para si mesmo
  @Owner('alunoId', 'body')
  @Post()
  create(@Body() createProgressoDto: CreateProgressoDto) {
    return this.progressoService.create(createProgressoDto);
  }

  @Get()
  findAll(
    @CurrentUser() user: AutenticatedUser,
    @Query('alunoId') alunoId?: string,
    @Query('tarefaId') tarefaId?: string,
  ) {
    // Aluno só consulta o próprio progresso
    if (user.role !== 'professor' && (!alunoId || alunoId !== user.uid)) {
      throw new ForbiddenException(
        'Alunos só podem consultar o próprio progresso',
      );
    }
    if (alunoId) {
      return this.progressoService.findByAluno(alunoId);
    }
    if (tarefaId) {
      return this.progressoService.findByTarefa(tarefaId);
    }
    return this.progressoService.findAll();
  }

  // Conveniência: GET /progresso/find/:alunoId/:tarefaId
  @Owner('alunoId')
  @Get('find/:alunoId/:tarefaId')
  findOneFor(
    @Param('alunoId') alunoId: string,
    @Param('tarefaId') tarefaId: string,
  ) {
    return this.progressoService.findOneFor(alunoId, tarefaId);
  }

  @Owner('progressoId', 'param', true)
  @Get(':progressoId')
  findOne(@Param('progressoId') progressoId: string) {
    return this.progressoService.findOne(progressoId);
  }

  @Owner('progressoId', 'param', true)
  @Patch(':progressoId')
  update(
    @Param('progressoId') progressoId: string,
    @Body() updateProgressoDto: UpdateProgressoDto,
  ) {
    return this.progressoService.update(progressoId, updateProgressoDto);
  }

  @Roles('professor')
  @Delete(':progressoId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('progressoId') progressoId: string) {
    return this.progressoService.remove(progressoId);
  }
}
