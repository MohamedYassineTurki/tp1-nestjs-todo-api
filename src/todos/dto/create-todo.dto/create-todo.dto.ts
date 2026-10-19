import {
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator';
import { TODO_VALIDATION_MESSAGES } from '../../constants/todo-validation-messages';

export class CreateTodoDto {
  @IsString({
    message : TODO_VALIDATION_MESSAGES.NAME_STRING,
  })
  @IsNotEmpty({
    message : TODO_VALIDATION_MESSAGES.NAME_REQUIRED,
  })
  @MinLength(3, {
    message: TODO_VALIDATION_MESSAGES.NAME_MIN
  })
  @MaxLength(10, {
    message : TODO_VALIDATION_MESSAGES.NAME_MAX
  })
  name!: string;

  @IsString({
    message : TODO_VALIDATION_MESSAGES.DESCRIPTION_STRING
  })
  @IsNotEmpty({
    message : TODO_VALIDATION_MESSAGES.DESCRIPTION_REQUIRED
  })
  @MinLength(10, {
    message : TODO_VALIDATION_MESSAGES.DESCRIPTION_MIN
  })
  description!: string;
}
