import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { StatusEnum } from '../enums/status.enum';
import { TimestampEntity } from './timestamp.entity';

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
}
