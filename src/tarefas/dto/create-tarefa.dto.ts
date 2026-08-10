import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class StaticRuleDto {
  @IsIn(['variable_name', 'must_use', 'forbidden', 'min_occurrences'])
  type: 'variable_name' | 'must_use' | 'forbidden' | 'min_occurrences';

  @IsString()
  value: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  count?: number;
}

export class TestCaseDto {
  @IsString()
  input: string;

  @IsString()
  expectedOutput: string;

  @IsOptional()
  @IsString()
  descricao?: string;
}

export class CreateTarefaDto {
  @IsString()
  titulo: string;

  @IsString()
  descricao: string;

  @IsIn(['portugol', 'c', 'javascript', 'python'])
  linguagem: 'portugol' | 'c' | 'javascript' | 'python';

  @IsIn(['iniciante', 'intermediario', 'avancado'])
  nivel: 'iniciante' | 'intermediario' | 'avancado';

  @IsIn(['quiz', 'fill-in', 'correcao', 'codigo-livre', 'scaffold'])
  tipo: 'quiz' | 'fill-in' | 'correcao' | 'codigo-livre' | 'scaffold';

  @IsArray()
  @IsString({ each: true })
  turmaIds: string[];

  @IsString()
  professorId: string;

  @IsInt()
  @Min(0)
  xpRecompensa: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StaticRuleDto)
  staticRules?: StaticRuleDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TestCaseDto)
  testCases?: TestCaseDto[];

  // Só faz sentido no tipo "scaffold"
  @IsOptional()
  @IsString()
  scaffoldCode?: string | null;

  @IsOptional()
  @IsString()
  prazo?: string | null;
}
