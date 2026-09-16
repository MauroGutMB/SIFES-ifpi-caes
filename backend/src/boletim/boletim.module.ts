import { Module } from '@nestjs/common';
import { BoletimService } from './boletim.service';

@Module({
  providers: [BoletimService],
  exports: [BoletimService],
})
export class BoletimModule {}
