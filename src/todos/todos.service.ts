import { Injectable, NotFoundException } from '@nestjs/common';
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

  async findOne(id: number) {
    const todo = await this.todoRepository.findOneBy({ id });
    if (!todo) {
      throw new NotFoundException(`Le Todo avec l'id ${id} n'existe pas !`);
    }
    return todo;
  }

  create(createTodoDto: CreateTodoDto) {
    const todo = this.todoRepository.create(createTodoDto);
    return this.todoRepository.save(todo);
  }

  update(id: number, updateTodoDto: UpdateTodoDto) {
    return this.todoRepository.update(id, updateTodoDto);
  }

  restore(id: number) {
    return this.todoRepository.restore(id);
  }

  softDelete(id: number) {
    return this.todoRepository.softDelete(id);
  }

  remove(id: number) {
    return this.todoRepository.delete(id);
  }
}
