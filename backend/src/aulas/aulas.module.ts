import { Module } from '@nestjs/common';
import { AulasController } from './aulas.controller';
import { MateriaAulasController } from './materia-aulas.controller';
import { AulasService } from './aulas.service';

@Module({
  controllers: [AulasController, MateriaAulasController],
  providers: [AulasService],
  exports: [AulasService],
})
export class AulasModule {}
