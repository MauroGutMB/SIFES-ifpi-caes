import { Module } from '@nestjs/common';
import { BoletimModule } from '../boletim/boletim.module';
import { MateriasController } from './materias.controller';
import { MateriasService } from './materias.service';
import { MateriasEncerramentoCron } from './materias-encerramento.cron';

@Module({
  imports: [BoletimModule],
  controllers: [MateriasController],
  providers: [MateriasService, MateriasEncerramentoCron],
  exports: [MateriasService],
})
export class MateriasModule {}
