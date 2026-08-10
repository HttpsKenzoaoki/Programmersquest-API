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
import { TarefasService } from './tarefas.service';
import { CreateTarefaDto } from './dto/create-tarefa.dto';
import { UpdateTarefaDto } from './dto/update-tarefa.dto';

@Controller('tarefas')
export class TarefasController {
  constructor(private readonly tarefasService: TarefasService) {}

  @Post()
  create(@Body() createTarefaDto: CreateTarefaDto) {
    return this.tarefasService.create(createTarefaDto);
  }

  @Get()
  findAll(@Query('turmaId') turmaId?: string) {
    if (turmaId) {
      return this.tarefasService.findByTurma(turmaId);
    }
    return this.tarefasService.findAll();
  }

  @Get(':tarefaId')
  findOne(@Param('tarefaId') tarefaId: string) {
    return this.tarefasService.findOne(tarefaId);
  }

  @Patch(':tarefaId')
  update(
    @Param('tarefaId') tarefaId: string,
    @Body() updateTarefaDto: UpdateTarefaDto,
  ) {
    return this.tarefasService.update(tarefaId, updateTarefaDto);
  }

  @Delete(':tarefaId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('tarefaId') tarefaId: string) {
    return this.tarefasService.remove(tarefaId);
  }
}
