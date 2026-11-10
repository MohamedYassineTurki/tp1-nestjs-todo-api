import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { StatusEnum } from '../enums/status.enum';
import { TimestampEntity } from '../../common/entities/timestamp.entity';

@Entity('todos')
export class TodoEntity extends TimestampEntity{
  @PrimaryGeneratedColumn()
 
  id!: number;

  @Column()
  name!: string;

  @Column()
  description!: string;

  @Column({
    type: 'varchar',
    default: StatusEnum.TODO,
  })

  status!:StatusEnum;

  // Créateur du todo. Nullable : les todos créés avant le TP2 n'en ont pas.
  @Column({ type: 'integer', nullable: true })
  userId!: number | null;
}
