import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SkillModule } from '../skill/skill.module';
import { UserModule } from '../user/user.module';
import { Cv } from './entities/cv.entity';
import { CvService } from './cv.service';
import { CvController } from './cv.controller';

@Module({
  // UserModule et SkillModule exportent leurs services, injectés dans CvService.
  imports: [TypeOrmModule.forFeature([Cv]), UserModule, SkillModule],
  controllers: [CvController],
  providers: [CvService],
})
export class CvModule {}
