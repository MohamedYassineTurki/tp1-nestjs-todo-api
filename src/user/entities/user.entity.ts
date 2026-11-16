import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { TimestampEntity } from '../../common/entities/timestamp.entity';
import { Cv } from '../../cv/entities/cv.entity';
import { Role } from '../enums/role.enum';

@Entity('users')
export class User extends TimestampEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  username!: string;

  @Column({ unique: true })
  email!: string;

  // select: false : la colonne n'est jamais lue par find()/findOne(),
  // donc le mot de passe ne sort jamais dans une réponse.
  // Le login la demande explicitement avec addSelect (voir AuthService).
  @Column({ select: false })
  password!: string;

  @Column({ type: 'varchar', default: Role.USER })
  role!: Role;

  @OneToMany(() => Cv, (cv) => cv.user)
  cvs!: Cv[];
}