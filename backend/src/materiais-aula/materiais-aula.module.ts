import { Module } from '@nestjs/common';
import { MateriaisAulaController } from './materiais-aula.controller';
import { MaterialAulaItemController } from './material-aula-item.controller';
import { MateriaisAulaService } from './materiais-aula.service';

@Module({
  controllers: [MateriaisAulaController, MaterialAulaItemController],
  providers: [MateriaisAulaService],
})
export class MateriaisAulaModule {}
