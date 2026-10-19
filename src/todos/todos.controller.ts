import {
  Body,
  Controller,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { DataSource } from 'typeorm';
import { TodoEntity } from './entities/todo.entity';

import { CreateTodoDto } from './dto/create-todo.dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto/update-todo.dto';

@Controller('todos')
export class TodosController {

  constructor(private readonly dataSource: DataSource) {}

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