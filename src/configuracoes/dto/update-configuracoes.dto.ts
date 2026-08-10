import { Type } from 'class-transformer';
import {
  IsArray,
  IsHexColor,
  IsIn,
  IsNumber,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class EscalaDeNotaDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  min: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  max: number;

  @IsIn(['I', 'R', 'B', 'MB'])
  conceito: 'I' | 'R' | 'B' | 'MB';

  @IsHexColor()
  cor: string;
}

export class UpdateConfiguracoesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EscalaDeNotaDto)
  escalaDeNota: EscalaDeNotaDto[];
}
