import { Module } from '@nestjs/common';
import { BoletimModule } from '../boletim/boletim.module';
import { MateriaPlanoController } from './materia-plano.controller';
import { ItensAvaliacaoController } from './itens-avaliacao.controller';
import { PlanoDisciplinaService } from './plano-disciplina.service';

@Module({
  imports: [BoletimModule],
  controllers: [MateriaPlanoController, ItensAvaliacaoController],
  providers: [PlanoDisciplinaService],
  exports: [PlanoDisciplinaService],
})
export class PlanoDisciplinaModule {}
