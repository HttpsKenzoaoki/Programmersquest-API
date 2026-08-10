import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ConfiguracoesService } from './configuracoes.service';
import { UpdateConfiguracoesDto } from './dto/update-configuracoes.dto';

@Controller('configuracoes')
export class ConfiguracoesController {
  constructor(private readonly configuracoesService: ConfiguracoesService) {}

  @Get(':turmaId')
  findByTurma(@Param('turmaId') turmaId: string) {
    return this.configuracoesService.findByTurma(turmaId);
  }

  @Patch(':turmaId')
  update(
    @Param('turmaId') turmaId: string,
    @Body() updateConfiguracoesDto: UpdateConfiguracoesDto,
  ) {
    return this.configuracoesService.update(turmaId, updateConfiguracoesDto);
  }
}
