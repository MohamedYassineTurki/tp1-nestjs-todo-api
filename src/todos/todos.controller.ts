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
  Req,
} from '@nestjs/common';

// "import type" : une interface n'existe pas à l'exécution, elle ne peut donc
// pas servir de métadonnée de décorateur (exigé par isolatedModules).
import type { AuthRequest } from '../common/interfaces/auth-request.interface';
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

  // req.userId a été injecté par AuthMiddleware avant d'arriver ici.
  @Post()
  @Version('2')
  async addTodo(@Body() createTodoDto: CreateTodoDto, @Req() req: AuthRequest) {
    const savedTodo = await this.todosService.create(createTodoDto, req.userId);
    return {
      message: 'Todo ajouté avec succès !',
      data: savedTodo,
    };
  }

  @Patch(':id')
  async updateTodo(
    @Param('id') id: string,
    @Body() updateTodoDto: UpdateTodoDto,
    @Req() req: AuthRequest,
  ) {
    await this.todosService.update(Number(id), updateTodoDto, req.userId);
    return { message: 'Todo mis à jour !', id };
  }

  @Patch(':id/restore')
  async restoreTodo(@Param('id') id: string, @Req() req: AuthRequest) {
    await this.todosService.restore(Number(id), req.userId);
    return { message: 'Todo restauré !', id };
  }

  @Delete(':id/soft')
  async softDeleteTodo(@Param('id') id: string, @Req() req: AuthRequest) {
    await this.todosService.softDelete(Number(id), req.userId);
    return { message: 'Todo supprimé (soft delete) !', id };
  }

  @Delete(':id')
  async deleteTodo(@Param('id') id: string, @Req() req: AuthRequest) {
    await this.todosService.remove(Number(id), req.userId);
    return { message: 'Todo supprimé définitivement !', id };
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.todosService.findOne(id);
  }
}
