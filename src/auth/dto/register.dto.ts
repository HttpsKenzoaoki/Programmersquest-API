import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import type { Role } from '../../common/types/firestore.types';

export class RegisterDto {
  // Token de ID emitido pelo Firebase Auth após o cadastro no app
  @IsString()
  @IsNotEmpty()
  idToken: string;

  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsString()
  @Matches(/^\d{1,6}$/, { message: 'RM deve conter apenas dígitos' })
  rm: string;

  @IsIn(['aluno', 'professor'])
  role: Role;

  @IsOptional()
  @IsString()
  turmaId?: string;
}
