import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ConfiguracoesService } from './configuracoes.service';
import { UpdateConfiguracoesDto } from './dto/update-configuracoes.dto';
import { ConceitoQueryDto } from './dto/conceito-query.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('configuracoes')
export class ConfiguracoesController {
  constructor(private readonly configuracoesService: ConfiguracoesService) {}

  @Get(':turmaId')
  findByTurma(@Param('turmaId') turmaId: string) {
    return this.configuracoesService.findByTurma(turmaId);
  }

  // Converte nota (0-100) em conceito I/R/B/MB usando a escala da turma
  @Get(':turmaId/conceito')
  conceito(
    @Param('turmaId') turmaId: string,
    @Query() query: ConceitoQueryDto,
  ) {
    return this.configuracoesService.conceito(turmaId, query.nota);
  }

  @Roles('professor')
  @Patch(':turmaId')
  update(
    @Param('turmaId') turmaId: string,
    @Body() updateConfiguracoesDto: UpdateConfiguracoesDto,
  ) {
    return this.configuracoesService.update(turmaId, updateConfiguracoesDto);
  }
}
