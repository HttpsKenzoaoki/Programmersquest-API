import { Type } from 'class-transformer';
import { IsNumber, Max, Min } from 'class-validator';

export class ConceitoQueryDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  nota: number;
}
