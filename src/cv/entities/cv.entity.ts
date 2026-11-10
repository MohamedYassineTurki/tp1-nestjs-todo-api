import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { TimestampEntity } from '../../common/entities/timestamp.entity';
import { Skill } from '../../skill/entities/skill.entity';
import { User } from '../../user/entities/user.entity';

@Entity('cvs')
export class Cv extends TimestampEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column()
  firstname!: string;

  @Column()
  age!: number;

  // Chaîne et non nombre : un CIN peut commencer par 0.
  @Column()
  cin!: string;

  @Column()
  job!: string;

  @Column({ type: 'varchar', nullable: true })
  path!: string | null;

  // User 1 ─── * Cv : côté "plusieurs", c'est ici qu'est la clé étrangère userId.
  // eager : le user est chargé automatiquement avec chaque cv (find/findOne).
  // onDelete CASCADE : supprimer un user supprime ses cvs (au niveau SQL).
  @ManyToOne(() => User, (user) => user.cvs, {
    eager: true,
    onDelete: 'CASCADE',
  })
  user!: User | null;

  // Cv * ─── * Skill : @JoinTable crée la table de jointure cvs_skills_skills
  // et indique que Cv est le côté propriétaire de la relation.
  // eager : les skills sont chargés avec chaque cv.
  // Pas de cascade : on lie des skills existants (par leurs ids),
  // on n'en crée/modifie jamais à travers un cv.
  @ManyToMany(() => Skill, { eager: true })
  @JoinTable()
  skills!: Skill[];
}
