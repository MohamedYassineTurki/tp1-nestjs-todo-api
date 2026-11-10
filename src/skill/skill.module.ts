import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Skill } from './entities/skill.entity';
import { SkillService } from './skill.service';
import { SkillController } from './skill.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Skill])],
  controllers: [SkillController],
  providers: [SkillService],
  // Exporté pour que CvModule puisse retrouver les skills d'un cv (skillIds).
  exports: [SkillService],
})
export class SkillModule {}
