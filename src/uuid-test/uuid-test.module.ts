import { Module } from '@nestjs/common';
import { UuidTestService } from './uuid-test.service';
import { UuidTestController } from './uuid-test.controller';

@Module({
  providers: [UuidTestService],
  controllers: [UuidTestController],
})
export class UuidTestModule {}
