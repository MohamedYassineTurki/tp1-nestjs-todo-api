import {
  Body,
  Controller,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { CreateTodoDto } from './dto/create-todo.dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto/update-todo.dto';

@Controller('todos')
export class TodosController {

  @Post()
  create(@Body() createTodoDto: CreateTodoDto) {
    return {
      message: 'Todo valide !',
      data: createTodoDto,
    };
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTodoDto: UpdateTodoDto,
  ) {
    return {
      message: 'Mise à jour valide !',
      id,
      data: updateTodoDto,
    };
  }
}