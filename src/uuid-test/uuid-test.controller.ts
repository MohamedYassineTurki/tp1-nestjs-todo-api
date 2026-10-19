import { Controller, Get } from '@nestjs/common';
import { UuidTestService } from './uuid-test.service';

@Controller('uuid-test')
export class UuidTestController {
  constructor(private readonly uuidTestService: UuidTestService) {}

  @Get()
  generate() {
    return this.uuidTestService.generate();
  }
}
