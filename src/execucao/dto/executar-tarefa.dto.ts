import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

const TAMANHO_MAXIMO_CODIGO = 50_000;

export class ExecutarTarefaDto {
  @IsString()
  @IsNotEmpty()
  tarefaId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(TAMANHO_MAXIMO_CODIGO, {
    message: `Código muito grande (máximo ${TAMANHO_MAXIMO_CODIGO} caracteres)`,
  })
  codigo: string;
}
