import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TurmasService } from './turmas.service';
import { CreateTurmaDto } from './dto/create-turma.dto';
import { UpdateTurmaDto } from './dto/update-turma.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('turmas')
export class TurmasController {
  constructor(private readonly turmasService: TurmasService) {}

  @Roles('professor')
  @Post()
  create(@Body() createTurmaDto: CreateTurmaDto) {
    return this.turmasService.create(createTurmaDto);
  }

  @Get()
  findAll() {
    return this.turmasService.findAll();
  }

  @Get(':turmaId')
  findOne(@Param('turmaId') turmaId: string) {
    return this.turmasService.findOne(turmaId);
  }

  @Roles('professor')
  @Patch(':turmaId')
  update(
    @Param('turmaId') turmaId: string,
    @Body() updateTurmaDto: UpdateTurmaDto,
  ) {
    return this.turmasService.update(turmaId, updateTurmaDto);
  }

  @Roles('professor')
  @Delete(':turmaId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('turmaId') turmaId: string) {
    return this.turmasService.remove(turmaId);
  }
}
