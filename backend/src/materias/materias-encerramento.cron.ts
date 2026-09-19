import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MateriasService } from './materias.service';

/** Fecha automaticamente Matérias de Semestres já terminados — de hora em hora (baixo custo,
 * já que só olha Matérias ABERTA com Semestre vencido) e uma vez assim que o servidor sobe,
 * pra não esperar até uma hora cheia se ele ficou desligado no momento exato em que um
 * Semestre terminou. */
@Injectable()
export class MateriasEncerramentoCron implements OnApplicationBootstrap {
  private readonly logger = new Logger(MateriasEncerramentoCron.name);

  constructor(private readonly materias: MateriasService) {}

  async onApplicationBootstrap() {
    await this.executar();
  }

  @Cron(CronExpression.EVERY_HOUR)
  async executar() {
    const total = await this.materias.encerrarMateriasDeSemestresEncerrados();
    if (total > 0) {
      this.logger.log(
        `${total} Matéria(s) encerrada(s) automaticamente (Semestre já terminado)`,
      );
    }
  }
}
