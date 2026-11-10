import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';

import { TodoEntity } from './entities/todo.entity';
import { StatusEnum } from './enums/status.enum';
import { CreateTodoDto } from './dto/create-todo.dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto/update-todo.dto';
import { FilterTodoDto } from './dto/filter-todo.dto/filter-todo-dto';
import { PaginationDto } from './dto/pagination.dto/pagination.dto';

@Injectable()
export class TodosService {
  constructor(
    @InjectRepository(TodoEntity)
    private readonly todoRepository: Repository<TodoEntity>,
  ) {}

  // Slide 13 : nombre de todos par statut
  async getStats() {
    const rows = await this.todoRepository
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

  async findAllPaginated({ page, limit }: PaginationDto) {
    const [data, total] = await this.todoRepository.findAndCount({
      order: { id: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  search({ search, status }: FilterTodoDto) {
    const qb = this.todoRepository.createQueryBuilder('todo');

    if (search) {
      qb.andWhere(
        new Brackets((q) => {
          q.where('todo.name LIKE :search', { search: `%${search}%` }).orWhere(
            'todo.description LIKE :search',
          );
        }),
      );
    }

    if (status) {
      qb.andWhere('todo.status = :status', { status });
    }

    return qb.getMany();
  }

  // withDeleted : inclure les todos soft-deleted (nécessaire pour restore).
  async findOne(id: number, withDeleted = false) {
    const todo = await this.todoRepository.findOne({
      where: { id },
      withDeleted,
    });
    if (!todo) {
      throw new NotFoundException(`Le Todo avec l'id ${id} n'existe pas !`);
    }
    return todo;
  }

  create(createTodoDto: CreateTodoDto, userId: number) {
    const todo = this.todoRepository.create({ ...createTodoDto, userId });
    return this.todoRepository.save(todo);
  }

  async update(id: number, updateTodoDto: UpdateTodoDto, userId: number) {
    await this.checkOwnership(id, userId);
    return this.todoRepository.update(id, updateTodoDto);
  }

  async restore(id: number, userId: number) {
    await this.checkOwnership(id, userId, true);
    return this.todoRepository.restore(id);
  }

  async softDelete(id: number, userId: number) {
    await this.checkOwnership(id, userId);
    return this.todoRepository.softDelete(id);
  }

  async remove(id: number, userId: number) {
    await this.checkOwnership(id, userId);
    return this.todoRepository.delete(id);
  }

  // 404 si le todo n'existe pas, 403 si le user n'en est pas le créateur.
  private async checkOwnership(
    id: number,
    userId: number,
    withDeleted = false,
  ) {
    const todo = await this.findOne(id, withDeleted);
    if (todo.userId !== userId) {
      throw new ForbiddenException("Vous n'êtes pas le créateur de ce Todo");
    }
  }
}
