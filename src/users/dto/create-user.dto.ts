import {
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';
import type { Role, Trilha } from '../../common/types/firestore.types';

export class CreateUserDto {
  // Opcional: se não informado, o Firestore gera o uid automaticamente
  @IsOptional()
  @IsString()
  uid?: string;

  @IsString()
  nome: string;

  @IsString()
  @Matches(/^\d{1,6}$/, { message: 'RM deve conter apenas dígitos' })
  rm: string;

  @IsEmail()
  email: string;

  @IsIn(['aluno', 'professor'])
  role: Role;

  @IsOptional()
  @IsString()
  turmaId?: string | null;

  @IsOptional()
  @IsIn(['iniciante', 'intermediario', 'avancado'])
  trilha?: Trilha;

  @IsOptional()
  @IsInt()
  @Min(0)
  xpTotal?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  streak?: number;

  @IsOptional()
  @IsString()
  ultimoAcessoEm?: string | null;
}
