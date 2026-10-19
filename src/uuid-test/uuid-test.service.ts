import { Inject, Injectable } from '@nestjs/common';
import { UUID_PROVIDER } from '../common/constants/common.constants';

@Injectable()
export class UuidTestService {
  constructor(
    @Inject(UUID_PROVIDER)
    private readonly generateUuid: () => string,
  ) {}

  generate() {
    return {
      id: this.generateUuid(),
    };
  }
}
