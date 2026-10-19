import {
  Body,
  Controller,
  Delete,
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
  async updateTodo(
    @Param('id') id: string,
    @Body() updateTodoDto: UpdateTodoDto,
  ) {
    const repository = this.dataSource.getRepository(TodoEntity);
    await repository.update(Number(id), updateTodoDto);
    return { message: 'Todo mis à jour !', id };
  }
  
  @Patch(':id/restore')
  async restoreTodo(@Param('id') id: string) {
    const repository = this.dataSource.getRepository(TodoEntity);
    await repository.restore(Number(id));
    return { message: 'Todo restauré !', id };
  }

  @Delete(':id/soft')
  async softDeleteTodo(@Param('id') id: string) {
    const repository = this.dataSource.getRepository(TodoEntity);
    await repository.softDelete(Number(id));
    return { message: 'Todo supprimé (soft delete) !', id };
  }


  @Delete(':id')
  async deleteTodo(@Param('id') id: string) {
    const repository = this.dataSource.getRepository(TodoEntity);
    await repository.delete(Number(id));
    return { message: 'Todo supprimé définitivement !', id };
  }
  
}