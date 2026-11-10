import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { TimestampEntity } from '../../common/entities/timestamp.entity';
import { Cv } from '../../cv/entities/cv.entity';

@Entity('users')
export class User extends TimestampEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  username!: string;

  @Column()
  email!: string;

  // select: false : la colonne n'est jamais lue par find()/findOne(),
  // donc le mot de passe ne sort jamais dans une réponse.
  // (Le login de la partie 4 devra la demander explicitement.)
  @Column({ select: false })
  password!: string;

  // Côté inverse de Cv.user : pas de colonne en base ici.
  // Pas d'eager : on ne charge pas tous les cvs à chaque lecture d'un user,
  // et on évite une boucle avec l'eager de Cv.user.
  @OneToMany(() => Cv, (cv) => cv.user)
  cvs!: Cv[];
}
