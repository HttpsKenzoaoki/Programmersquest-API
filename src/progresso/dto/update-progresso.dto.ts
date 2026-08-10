import { PartialType } from '@nestjs/mapped-types';
import { CreateProgressoDto } from './create-progresso.dto';

export class UpdateProgressoDto extends PartialType(CreateProgressoDto) {}
