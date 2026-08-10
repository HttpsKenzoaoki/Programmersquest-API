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
} from '@nestjs/common';
import { ProgressoService } from './progresso.service';
import { CreateProgressoDto } from './dto/create-progresso.dto';
import { UpdateProgressoDto } from './dto/update-progresso.dto';

@Controller('progresso')
export class ProgressoController {
  constructor(private readonly progressoService: ProgressoService) {}

  @Post()
  create(@Body() createProgressoDto: CreateProgressoDto) {
    return this.progressoService.create(createProgressoDto);
  }

  @Get()
  findAll(
    @Query('alunoId') alunoId?: string,
    @Query('tarefaId') tarefaId?: string,
  ) {
    if (alunoId) {
      return this.progressoService.findByAluno(alunoId);
    }
    if (tarefaId) {
      return this.progressoService.findByTarefa(tarefaId);
    }
    return this.progressoService.findAll();
  }

  // Conveniência: GET /progresso/find/:alunoId/:tarefaId
  @Get('find/:alunoId/:tarefaId')
  findOneFor(
    @Param('alunoId') alunoId: string,
    @Param('tarefaId') tarefaId: string,
  ) {
    return this.progressoService.findOneFor(alunoId, tarefaId);
  }

  @Get(':progressoId')
  findOne(@Param('progressoId') progressoId: string) {
    return this.progressoService.findOne(progressoId);
  }

  @Patch(':progressoId')
  update(
    @Param('progressoId') progressoId: string,
    @Body() updateProgressoDto: UpdateProgressoDto,
  ) {
    return this.progressoService.update(progressoId, updateProgressoDto);
  }

  @Delete(':progressoId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('progressoId') progressoId: string) {
    return this.progressoService.remove(progressoId);
  }
}
