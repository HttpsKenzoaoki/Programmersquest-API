import {
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateProgressoDto {
  @IsString()
  alunoId: string;

  @IsString()
  tarefaId: string;

  @IsIn(['bloqueada', 'disponivel', 'em-andamento', 'concluida'])
  status: 'bloqueada' | 'disponivel' | 'em-andamento' | 'concluida';

  @IsOptional()
  @IsInt()
  @Min(0)
  tentativas?: number;

  // 0 a 100 internamente
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  melhorNota?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  xpGanho?: number;

  @IsOptional()
  @IsString()
  ultimaTentativa?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  errosComuns?: string[];
}
