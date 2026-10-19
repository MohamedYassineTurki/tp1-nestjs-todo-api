import { Test, TestingModule } from '@nestjs/testing';
import { UuidTestController } from './uuid-test.controller';

describe('UuidTestController', () => {
  let controller: UuidTestController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UuidTestController],
    }).compile();

    controller = module.get<UuidTestController>(UuidTestController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
