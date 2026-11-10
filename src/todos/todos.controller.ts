import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Version,
  ParseIntPipe,
  Query,
} from '@nestjs/common';

import { TodosService } from './todos.service';
import { CreateTodoDto } from './dto/create-todo.dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto/update-todo.dto';
import { FilterTodoDto } from './dto/filter-todo.dto/filter-todo-dto';
import { PaginationDto } from './dto/pagination.dto/pagination.dto';

@Controller('todos')
export class TodosController {
  constructor(private readonly todosService: TodosService) {}

  // Les routes fixes (stats, search) sont déclarées avant ':id'
  // pour ne pas être capturées par la route paramétrée.
  @Get('stats')
  getStats() {
    return this.todosService.getStats();
  }

  @Get()
  getAll(@Query() paginationDto: PaginationDto) {
    return this.todosService.findAllPaginated(paginationDto);
  }

  @Get('search')
  findAll(@Query() filterDto: FilterTodoDto) {
    return this.todosService.search(filterDto);
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
  async addTodo(@Body() createTodoDto: CreateTodoDto) {
    const savedTodo = await this.todosService.create(createTodoDto);
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
    await this.todosService.update(Number(id), updateTodoDto);
    return { message: 'Todo mis à jour !', id };
  }

  @Patch(':id/restore')
  async restoreTodo(@Param('id') id: string) {
    await this.todosService.restore(Number(id));
    return { message: 'Todo restauré !', id };
  }

  @Delete(':id/soft')
  async softDeleteTodo(@Param('id') id: string) {
    await this.todosService.softDelete(Number(id));
    return { message: 'Todo supprimé (soft delete) !', id };
  }

  @Delete(':id')
  async deleteTodo(@Param('id') id: string) {
    await this.todosService.remove(Number(id));
    return { message: 'Todo supprimé définitivement !', id };
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.todosService.findOne(id);
  }
}
