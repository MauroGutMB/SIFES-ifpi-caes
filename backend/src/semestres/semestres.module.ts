import { Module } from '@nestjs/common';
import { MateriasModule } from '../materias/materias.module';
import { SemestresController } from './semestres.controller';
import { SemestresService } from './semestres.service';

@Module({
  imports: [MateriasModule],
  controllers: [SemestresController],
  providers: [SemestresService],
  exports: [SemestresService],
})
export class SemestresModule {}
