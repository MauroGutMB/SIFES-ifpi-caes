import { Module } from '@nestjs/common';
import { BoletimModule } from '../boletim/boletim.module';
import { PendenciasController } from './pendencias.controller';
import { PendenciasService } from './pendencias.service';

@Module({
  imports: [BoletimModule],
  controllers: [PendenciasController],
  providers: [PendenciasService],
  exports: [PendenciasService],
})
export class PendenciasModule {}
