import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';

import { TimestampEntity } from '../../common/entities/timestamp.entity';
import { Cv } from '../../cv/entities/cv.entity';

@Entity('skills')
export class Skill extends TimestampEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  designation!: string;

  // Côté inverse de Cv.skills : pas de @JoinTable ici (Cv est propriétaire).
  // Pas d'eager : on ne charge pas tous les cvs à chaque lecture d'un skill,
  // et on évite une boucle avec l'eager de Cv.skills.
  @ManyToMany(() => Cv, (cv) => cv.skills)
  cvs!: Cv[];
}
