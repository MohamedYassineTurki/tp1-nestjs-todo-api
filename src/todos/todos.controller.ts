import {
  Body,
  Controller,
  Param,
  Patch,
  Post,
  Version,
} from '@nestjs/common';

import { DataSource } from 'typeorm';
import { TodoEntity } from './entities/todo.entity';

import { CreateTodoDto } from './dto/create-todo.dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto/update-todo.dto';

@Controller('todos')
export class TodosController {

  constructor(private readonly dataSource: DataSource) {}

  @Post()
  @Version('1')
  create(@Body() createTodoDto: CreateTodoDto) {
  return {
    message: 'Todo valide !',
    data: createTodoDto,
  };
  }

  @Post()
  @Version('2')
  async addTodo(@Body() createTodoDto: CreateTodoDto){
    const repository = this.dataSource.getRepository(TodoEntity);
    const todo = repository.create(createTodoDto);
    const savedTodo = await repository.save(todo);

    return {
      message: 'Todo ajouté avec succès !',
      data: savedTodo,
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