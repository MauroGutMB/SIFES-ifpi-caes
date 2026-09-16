import { Module } from '@nestjs/common';
import { BoletimModule } from '../boletim/boletim.module';
import { MateriasController } from './materias.controller';
import { MateriasService } from './materias.service';

@Module({
  imports: [BoletimModule],
  controllers: [MateriasController],
  providers: [MateriasService],
  exports: [MateriasService],
})
export class MateriasModule {}
