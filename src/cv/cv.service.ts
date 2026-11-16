import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';

import { CrudService } from '../common/services/crud.service';
import { SkillService } from '../skill/skill.service';
import type { User } from '../user/entities/user.entity';
import { Role } from '../user/enums/role.enum';
import { UserService } from '../user/user.service';
import { CreateCvDto } from './dto/create-cv.dto';
import { UpdateCvDto } from './dto/update-cv.dto';
import { Cv } from './entities/cv.entity';

@Injectable()
export class CvService extends CrudService<Cv> {
  constructor(
    @InjectRepository(Cv) repository: Repository<Cv>,
    private readonly userService: UserService,
    private readonly skillService: SkillService,
  ) {
    super(repository);
  }

  // Redéfinition : on remplace userId / skillIds par les entités,
  // puis on réutilise le create du parent (super).
  async create(createCvDto: CreateCvDto): Promise<Cv> {
    const { userId, skillIds, ...cvData } = createCvDto;
    const relations = await this.loadRelations(userId, skillIds);
    return super.create({ ...cvData, ...relations });
  }

  override async findAll(user?: Pick<User, 'id' | 'role'>): Promise<Cv[]> {
    if (!user) {
      throw new UnauthorizedException('Utilisateur non authentifié');
    }
    if (user.role === Role.ADMIN) {
      return super.findAll();
    }
    return this.repository.find({ where: { user: { id: user.id } } });
  }

  async find(id: number, ownerId?: number): Promise<Cv> {
    if (ownerId === undefined) {
      throw new UnauthorizedException('Utilisateur non authentifié');
    }
    const cv = await super.findOne(id);
    if (cv.user?.id !== ownerId) {
      throw new ForbiddenException('Ce CV ne vous appartient pas');
    }
    return cv;
  }

  override async update(id: number, dto: UpdateCvDto, ownerId?: number): Promise<Cv> {
    await this.find(id, ownerId);
    const { skillIds, ...cvData } = dto;
    const relations = await this.loadRelations(undefined, skillIds);
    return super.update(id, { ...cvData, ...relations });
  }

  override async remove(id: number, ownerId?: number): Promise<Cv> {
    const cv = await this.find(id, ownerId);
    await this.repository.delete(id);
    return cv;
  }

  // Seuls les champs fournis sont convertis : en update, ne pas envoyer
  // skillIds laisse les skills inchangés ; envoyer [] les retire tous.
  // Les findOne / findByIds lèvent une 404 si un id n'existe pas.
  private async loadRelations(
    userId?: number,
    skillIds?: number[],
  ): Promise<DeepPartial<Cv>> {
    const relations: DeepPartial<Cv> = {};
    if (userId !== undefined) {
      relations.user = await this.userService.findOne(userId);
    }
    if (skillIds !== undefined) {
      relations.skills = await this.skillService.findByIds(skillIds);
    }
    return relations;
  }
}
