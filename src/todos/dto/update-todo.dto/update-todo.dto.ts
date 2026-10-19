import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';

import { CreateTodoDto } from '../create-todo.dto/create-todo.dto';
import { StatusEnum } from '../../enums/status.enum';
import { TODO_VALIDATION_MESSAGES } from '../../constants/todo-validation-messages';

export class UpdateTodoDto extends PartialType(CreateTodoDto) {
  @IsOptional()
  @IsEnum(StatusEnum, {
    message: TODO_VALIDATION_MESSAGES.STATUS_INVALID,
  })
  status?: StatusEnum;
}
