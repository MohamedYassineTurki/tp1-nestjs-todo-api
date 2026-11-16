import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CommonModule } from './common/common.module';
import { UuidTestModule } from './uuid-test/uuid-test.module';
import { TodoEntity } from './todos/entities/todo.entity';
import { TodosModule } from './todos/todos.module';
import { UserModule } from './user/user.module';
import { User } from './user/entities/user.entity';
import { SkillModule } from './skill/skill.module';
import { Skill } from './skill/entities/skill.entity';
import { CvModule } from './cv/cv.module';
import { Cv } from './cv/entities/cv.entity';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: 'todo.sqlite',
      entities: [TodoEntity, User, Skill, Cv],
      synchronize: true,
    }),
    CommonModule,
    UuidTestModule,
    TodosModule,
    UserModule,
    SkillModule,
    CvModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
/*
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Toutes les routes de TodosController (contrôleur de persistance),
    // y compris leurs versions /v1 et /v2.
    consumer.apply(AuthMiddleware).forRoutes(TodosController);
  }
}
*/