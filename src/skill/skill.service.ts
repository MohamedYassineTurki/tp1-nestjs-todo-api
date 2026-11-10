import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { CrudService } from '../common/services/crud.service';
import { Skill } from './entities/skill.entity';

@Injectable()
export class SkillService extends CrudService<Skill> {
  constructor(@InjectRepository(Skill) repository: Repository<Skill>) {
    super(repository);
  }

  // Utilisé par CvService : transforme une liste d'ids en entités Skill.
  // 404 si au moins un id n'existe pas (au lieu de l'ignorer en silence).
  async findByIds(ids: number[]): Promise<Skill[]> {
    const skills = await this.repository.findBy({ id: In(ids) });
    const missingIds = ids.filter(
      (id) => !skills.some((skill) => skill.id === id),
    );
    if (missingIds.length > 0) {
      throw new NotFoundException(
        `Skill(s) introuvable(s) : ${missingIds.join(', ')}`,
      );
    }
    return skills;
  }
}
