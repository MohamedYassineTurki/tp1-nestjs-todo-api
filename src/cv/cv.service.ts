import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';

import { CrudService } from '../common/services/crud.service';
import { SkillService } from '../skill/skill.service';
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

  async update(id: number, updateCvDto: UpdateCvDto): Promise<Cv> {
    const { userId, skillIds, ...cvData } = updateCvDto;
    const relations = await this.loadRelations(userId, skillIds);
    return super.update(id, { ...cvData, ...relations });
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
