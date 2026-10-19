import { Test, TestingModule } from '@nestjs/testing';
import { UuidTestService } from './uuid-test.service';

describe('UuidTestService', () => {
  let service: UuidTestService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UuidTestService],
    }).compile();

    service = module.get<UuidTestService>(UuidTestService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
