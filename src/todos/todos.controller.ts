import {
  Body,
  Controller,
  Delete,
  Get, //ki
  Param,
  NotFoundException,
  Patch,
  Post,
  Version,
  ParseIntPipe,
} from '@nestjs/common';

import { DataSource } from 'typeorm';
import { TodoEntity } from './entities/todo.entity';
import { StatusEnum } from './enums/status.enum'; //ki

import { CreateTodoDto } from './dto/create-todo.dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto/update-todo.dto';

@Controller('todos')
export class TodosController {

  constructor(private readonly dataSource: DataSource) {}
    // Slide 13 ki
  @Get('stats')
  async getStats() {
    const rows = await this.dataSource
      .getRepository(TodoEntity)
      .createQueryBuilder('todo')
      .select('todo.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('todo.status')
      .getRawMany<{ status: StatusEnum; count: string }>();

    const stats = {
      [StatusEnum.TODO]: 0,
      [StatusEnum.IN_PROGRESS]: 0,
      [StatusEnum.DONE]: 0,
    };
    rows.forEach((row) => (stats[row.status] = Number(row.count)));
    return stats;
  }
  
    // Slide 14 ki
  @Get()
  async getAll() {
    return this.dataSource.getRepository(TodoEntity).find();
  }
  
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
  
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
  const todo = await this.dataSource
    .getRepository(TodoEntity)
    .findOneBy({ id });

  if (!todo) {
    throw new NotFoundException(`Le Todo avec l'id ${id} n'existe pas !`);
  }

  return todo;
}
}

