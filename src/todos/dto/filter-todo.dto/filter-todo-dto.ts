import { IsEnum, IsOptional, IsString } from 'class-validator';
import { StatusEnum } from '../../enums/status.enum';

export class FilterTodoDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(StatusEnum)
  status?: StatusEnum;
}