import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StatusFrequencia } from '../../generated/prisma/client';
import {
  calcularFrequenciaPercentual,
  calcularNotaFinal,
  calcularSituacao,
} from './boletim.util';

@Injectable()
export class BoletimService {
  constructor(private readonly prisma: PrismaService) {}

  async calcularBoletimMateria(materiaId: string) {
    const materia = await this.prisma.materia.findUniqueOrThrow({
      where: { id: materiaId },
      include: {
        itensAvaliacao: {
          include: { notas: true, alunosHabilitados: true },
        },
        vinculos: {
          include: {
            aluno: { select: { id: true, nome: true, matricula: true } },
          },
        },
      },
    });

    const aulas = await this.prisma.aula.findMany({
      where: { materiaId },
      select: { id: true },
    });
    const aulaIds = aulas.map((a) => a.id);
    const frequencias = await this.prisma.frequencia.findMany({
      where: { aulaId: { in: aulaIds } },
    });

    const materiaAberta = materia.estado === 'ABERTA';
    const notaMinimaAprovacao = materia.notaMinimaAprovacao.toNumber();

    return materia.vinculos.map(({ aluno }) => {
      const itensDoAluno = materia.itensAvaliacao.map((item) => {
        const nota = item.notas.find((n) => n.alunoId === aluno.id);
        const habilitadoParaAluno = item.alunosHabilitados.some(
          (h) => h.alunoId === aluno.id,
        );
        return {
          id: item.id,
          valorMaximo: item.valorMaximo.toNumber(),
          valorObtido: nota ? nota.valorObtido.toNumber() : 0,
          peso: item.peso.toNumber(),
          especial: item.especial,
          modoEspecial: item.modoEspecial,
          itemSubstituidoId: item.itemSubstituidoId,
          habilitadoParaAluno,
          // Só usado pra decidir se a média é parcial — item sem nota entra como 0 no cálculo
          // real, mas isso não é "a nota definitiva dele" enquanto o professor não lançou.
          notaLancada: !!nota,
        };
      });
      const frequenciasDoAluno = frequencias.filter(
        (f) => f.alunoId === aluno.id,
      );

      const notaFinal = calcularNotaFinal(itensDoAluno, notaMinimaAprovacao);
      const frequenciaPercentual =
        calcularFrequenciaPercentual(frequenciasDoAluno);
      const situacao = calcularSituacao(
        materiaAberta,
        notaFinal,
        frequenciaPercentual,
        notaMinimaAprovacao,
      );
      const faltas = frequenciasDoAluno.filter(
        (f) => f.status === StatusFrequencia.FALTA,
      ).length;
      // Parcial = ainda falta lançar a nota de algum item que conta pra esse aluno (item normal,
      // ou especial já habilitado pra ele) — a média mostrada pode subir/descer quando entrar.
      const notaParcial = itensDoAluno.some(
        (item) =>
          (!item.especial || item.habilitadoParaAluno) && !item.notaLancada,
      );

      return {
        aluno,
        notaFinal: Number(notaFinal.toFixed(2)),
        notaParcial,
        frequenciaPercentual: Number(frequenciaPercentual.toFixed(2)),
        situacao,
        faltas,
      };
    });
  }
}
