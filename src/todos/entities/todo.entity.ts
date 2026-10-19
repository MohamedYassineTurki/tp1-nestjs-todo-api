import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  DeleteDateColumn
} from 'typeorm';
import { StatusEnum } from '../enums/status.enum';

@Entity('todos')
export class TodoEntity {
  @PrimaryGeneratedColumn()
 
  id!: number;

  @Column()
  name!: string;

  @Column()
  description!: string;

  @CreateDateColumn({update : false })
  createdAt!: Date;

  @Column({
    type: 'varchar',
    default: StatusEnum.TODO,
  })
  status!: StatusEnum;
  @UpdateDateColumn()
  updatedAt!:Date ; 

  @DeleteDateColumn()
  deletedAt!: Date | null;
}
