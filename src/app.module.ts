import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql' as const,
        host: config.getOrThrow<string>('DB_HOST'),
        port: Number(config.getOrThrow<string>('DB_PORT')),
        username: config.getOrThrow<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD', ''),
        database: config.getOrThrow<string>('DB_DATABASE'),
        entities: [TodoEntity, User, Skill, Cv],
        synchronize: config.get<string>('DB_SYNCHRONIZE', 'true') === 'true',
      }),
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