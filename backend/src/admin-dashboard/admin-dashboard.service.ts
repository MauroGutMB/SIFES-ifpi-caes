import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BoletimService } from '../boletim/boletim.service';
import { EstadoMateria } from '../../generated/prisma/client';
import { agoraComoBrasiliaFake } from '../common/tempo.util';

@Injectable()
export class AdminDashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly boletim: BoletimService,
  ) {}

  async contagens() {
    const hoje = agoraComoBrasiliaFake();
    const semestreAtual = await this.prisma.semestre.findFirst({
      where: { dataInicio: { lte: hoje }, dataFim: { gte: hoje } },
    });

    const [totalProfessores, totalAlunos, alunosSemTurma] = await Promise.all([
      this.prisma.professor.count(),
      this.prisma.aluno.count(),
      this.prisma.aluno.count({ where: { turmaId: null } }),
    ]);

    const materiasSemestreAtual = semestreAtual
      ? await this.prisma.materia.count({
          where: { turma: { semestreId: semestreAtual.id } },
        })
      : 0;

    const alunosComPendencia = await this.contarAlunosComPendencia();

    return {
      semestreAtual: semestreAtual
        ? { id: semestreAtual.id, nome: semestreAtual.nome }
        : null,
      totalProfessores,
      totalAlunos,
      alunosSemTurma,
      materiasSemestreAtual,
      alunosComPendencia,
    };
  }

  /** Aluno pendente: turma vinculada, todas as Matérias dela encerradas, reprovado em alguma. */
  private async contarAlunosComPendencia(): Promise<number> {
    const alunos = await this.prisma.aluno.findMany({
      where: { turmaId: { not: null } },
      select: { id: true, turmaId: true },
    });

    let count = 0;
    for (const aluno of alunos) {
      const vinculos = await this.prisma.vinculoAlunoMateria.findMany({
        where: { alunoId: aluno.id, materia: { turmaId: aluno.turmaId! } },
        include: { materia: true },
      });
      if (vinculos.length === 0) continue;

      const todasEncerradas = vinculos.every(
        (v) => v.materia.estado === EstadoMateria.ENCERRADA,
      );
      if (!todasEncerradas) continue;

      for (const vinculo of vinculos) {
        const boletim = await this.boletim.calcularBoletimMateria(
          vinculo.materiaId,
        );
        const linha = boletim.find((b) => b.aluno.id === aluno.id);
        if (linha?.situacao === 'REPROVADO') {
          count++;
          break;
        }
      }
    }
    return count;
  }
}
