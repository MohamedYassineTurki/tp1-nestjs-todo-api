import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

import { TimestampEntity } from '../../common/entities/timestamp.entity';

// Relation Cv * ─── * Skill unidirectionnelle : seul Cv déclare @ManyToMany
// (avec @JoinTable). On n'a pas besoin de lister les cvs depuis un skill.
@Entity('skills')
export class Skill extends TimestampEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  designation!: string;
}
