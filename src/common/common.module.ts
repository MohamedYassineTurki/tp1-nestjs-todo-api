import { Global, Module } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { UUID_PROVIDER } from './constants/common.constants';

@Global()
@Module({
  providers: [
    {
      provide: UUID_PROVIDER,
      useValue: uuidv4,
    },
  ],
  exports: [UUID_PROVIDER],
})
export class CommonModule {}
