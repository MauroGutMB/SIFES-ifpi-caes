import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PendenciasService } from '../pendencias/pendencias.service';
import { agoraComoBrasiliaFake } from '../common/tempo.util';

@Injectable()
export class AdminDashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pendencias: PendenciasService,
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

    const alunosComPendencia = (
      await this.pendencias.listarPorStatus('PENDENTE')
    ).length;

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
}
