import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

import { TimestampEntity } from '../../common/entities/timestamp.entity';

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
}
