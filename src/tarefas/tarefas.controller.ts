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
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('tarefas')
export class TarefasController {
  constructor(private readonly tarefasService: TarefasService) {}

  @Roles('professor')
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

  @Roles('professor')
  @Patch(':tarefaId')
  update(
    @Param('tarefaId') tarefaId: string,
    @Body() updateTarefaDto: UpdateTarefaDto,
  ) {
    return this.tarefasService.update(tarefaId, updateTarefaDto);
  }

  @Roles('professor')
  @Delete(':tarefaId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('tarefaId') tarefaId: string) {
    return this.tarefasService.remove(tarefaId);
  }
}
