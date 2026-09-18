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

    return materia.vinculos.map(({ aluno }) => {
      const itensDoAluno = materia.itensAvaliacao.map((item) => {
        const nota = item.notas.find((n) => n.alunoId === aluno.id);
        return {
          id: item.id,
          valorMaximo: item.valorMaximo.toNumber(),
          valorObtido: nota ? nota.valorObtido.toNumber() : 0,
          peso: item.peso.toNumber(),
          especial: item.especial,
          modoEspecial: item.modoEspecial,
          itemSubstituidoId: item.itemSubstituidoId,
          notaMetaMinima: item.notaMetaMinima
            ? item.notaMetaMinima.toNumber()
            : null,
          habilitadoParaAluno: item.alunosHabilitados.some(
            (h) => h.alunoId === aluno.id,
          ),
        };
      });
      const frequenciasDoAluno = frequencias.filter(
        (f) => f.alunoId === aluno.id,
      );

      const notaFinal = calcularNotaFinal(itensDoAluno);
      const frequenciaPercentual =
        calcularFrequenciaPercentual(frequenciasDoAluno);
      const situacao = calcularSituacao(
        materiaAberta,
        notaFinal,
        frequenciaPercentual,
      );
      const faltas = frequenciasDoAluno.filter(
        (f) => f.status === StatusFrequencia.FALTA,
      ).length;

      return {
        aluno,
        notaFinal: Number(notaFinal.toFixed(2)),
        frequenciaPercentual: Number(frequenciaPercentual.toFixed(2)),
        situacao,
        faltas,
      };
    });
  }
}
