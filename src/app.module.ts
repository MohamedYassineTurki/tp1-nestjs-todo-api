import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommonModule } from './common/common.module';
import { AuthMiddleware } from './common/middlewares/auth.middleware';
import { UuidTestModule } from './uuid-test/uuid-test.module';
import { TodoEntity } from './todos/entities/todo.entity';
import { TodosModule } from './todos/todos.module';
import { TodosController } from './todos/todos.controller';
import { UserModule } from './user/user.module';
import { User } from './user/entities/user.entity';

@Module({
  imports: [
    // Charge .env dans process.env et rend ConfigService injectable partout.
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: 'todo.sqlite',
      entities: [TodoEntity, User],
      synchronize: true,
    }),
    CommonModule,
    UuidTestModule,
    TodosModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Toutes les routes de TodosController (contrôleur de persistance),
    // y compris leurs versions /v1 et /v2.
    consumer.apply(AuthMiddleware).forRoutes(TodosController);
  }
}
