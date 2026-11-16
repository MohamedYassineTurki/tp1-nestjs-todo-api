import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CrudService } from '../common/services/crud.service';
import { User } from './entities/user.entity';


@Injectable()
export class UserService extends CrudService<User> {
  constructor(@InjectRepository(User) repository: Repository<User>) {
    super(repository);
  }
  
  async create(dto: CreateUserDto): Promise<User> {
    return super.create({ ...dto, password: await bcrypt.hash(dto.password, 10) });
  }

  async update(id: number, dto: UpdateUserDto): Promise<User> {
    if (dto.password !== undefined) {
      return super.update(id, { ...dto, password: await bcrypt.hash(dto.password, 10) });
    }
    return super.update(id, dto);
  }
}
