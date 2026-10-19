import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommonModule } from './common/common.module';
import { UuidTestModule } from './uuid-test/uuid-test.module';
import { TodoEntity } from './todos/entities/todo.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: 'todo.sqlite',
      entities: [TodoEntity],
      synchronize: true,
    }),
    CommonModule,
    UuidTestModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
