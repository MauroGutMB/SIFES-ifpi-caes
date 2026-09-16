import { Module } from '@nestjs/common';
import { SemestresController } from './semestres.controller';
import { SemestresService } from './semestres.service';

@Module({
  controllers: [SemestresController],
  providers: [SemestresService],
  exports: [SemestresService],
})
export class SemestresModule {}
