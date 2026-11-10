import { NotFoundException } from '@nestjs/common';
import { DeepPartial, FindOptionsWhere, Repository } from 'typeorm';

// Contrainte minimale sur T : toute entité gérée a un id numérique.
export interface HasId {
  id: number;
}

// Service CRUD générique (design pattern Template / héritage) :
// CvService, SkillService et UserService en héritent au lieu de réécrire
// les mêmes 5 méthodes. Chaque service enfant lui passe son Repository<T>.
export abstract class CrudService<T extends HasId> {
  constructor(protected readonly repository: Repository<T>) {}

  findAll(): Promise<T[]> {
    return this.repository.find();
  }

  async findOne(id: number): Promise<T> {
    // Le cast est nécessaire : TypeScript ne sait pas que { id } est un
    // filtre valide pour un T générique, même si T a bien un id.
    const entity = await this.repository.findOneBy({
      id,
    } as FindOptionsWhere<T>);
    if (!entity) {
      throw this.notFound(id);
    }
    return entity;
  }

  async create(dto: DeepPartial<T>): Promise<T> {
    const saved = await this.repository.save(this.repository.create(dto));
    // On relit l'entité : les relations eager sont chargées et les colonnes
    // en select: false (ex. password) ne sont pas renvoyées.
    return this.findOne(saved.id);
  }

  async update(id: number, dto: DeepPartial<T>): Promise<T> {
    // preload : charge l'entité existante et fusionne le dto dedans,
    // ou renvoie undefined si l'id n'existe pas.
    const entity = await this.repository.preload({ ...dto, id });
    if (!entity) {
      throw this.notFound(id);
    }
    await this.repository.save(entity);
    return this.findOne(id);
  }

  async remove(id: number): Promise<T> {
    const entity = await this.findOne(id);
    await this.repository.delete(id);
    return entity;
  }

  // metadata.targetName = nom de la classe entité ("Cv", "Skill", "User").
  protected notFound(id: number) {
    return new NotFoundException(
      `${this.repository.metadata.targetName} avec l'id ${id} introuvable`,
    );
  }
}
