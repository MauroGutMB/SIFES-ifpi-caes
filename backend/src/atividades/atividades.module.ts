import { Module } from '@nestjs/common';
import { MateriaAtividadesController } from './materia-atividades.controller';
import { AtividadesController } from './atividades.controller';
import { EntregaController } from './entrega.controller';
import { AtividadesService } from './atividades.service';

@Module({
  controllers: [
    MateriaAtividadesController,
    AtividadesController,
    EntregaController,
  ],
  providers: [AtividadesService],
})
export class AtividadesModule {}
