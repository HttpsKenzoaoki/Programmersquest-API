import { IsIn, IsString } from 'class-validator';

export class CreateTurmaDto {
  @IsIn([1, 2, 3])
  ano: 1 | 2 | 3;

  @IsString()
  curso: string;

  @IsIn(['A', 'B'])
  letra: 'A' | 'B';

  @IsString()
  professorId: string;
}
