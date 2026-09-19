import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BoletimService } from '../boletim/boletim.service';
import { EstadoMateria } from '../../generated/prisma/client';
import {
  Formato,
  gerarRelatorio,
  TabelaRelatorio,
} from '../relatorios/report-render.util';

interface PendenciaBruta {
  alunoId: string;
  alunoNome: string;
  matricula: string;
  materiaId: string;
  materiaNome: string;
  semestreNome: string;
  notaFinal: number;
}

@Injectable()
export class PendenciasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly boletim: BoletimService,
  ) {}

  /** Pendência acadêmica nunca é armazenada — é calculada ao vivo a partir de disciplinas
   * encerradas em que o boletim do aluno deu REPROVADO. Isso garante que ela nunca fica
   * desatualizada em relação à nota real, e cobre disciplinas encerradas antes dessa feature
   * existir sem precisar de nenhuma migração de dados. */
  private async calcularTodas(): Promise<PendenciaBruta[]> {
    const materias = await this.prisma.materia.findMany({
      where: { estado: EstadoMateria.ENCERRADA },
      include: { turma: { include: { semestre: true } } },
    });

    const pendencias: PendenciaBruta[] = [];
    for (const materia of materias) {
      const boletim = await this.boletim.calcularBoletimMateria(materia.id);
      for (const linha of boletim) {
        if (linha.situacao !== 'REPROVADO') continue;
        pendencias.push({
          alunoId: linha.aluno.id,
          alunoNome: linha.aluno.nome,
          matricula: linha.aluno.matricula,
          materiaId: materia.id,
          materiaNome: materia.nome,
          semestreNome: materia.turma.semestre.nome,
          notaFinal: linha.notaFinal,
        });
      }
    }
    return pendencias;
  }

  private async carregarResolvidas(): Promise<Set<string>> {
    const resolvidas = await this.prisma.pendenciaResolvida.findMany();
    return new Set(resolvidas.map((r) => `${r.alunoId}:${r.materiaId}`));
  }

  /** Alunos com pelo menos uma pendência no status pedido — usado pelas duas tabelas
   * (Pendentes/Resolvidas) da tela de admin. */
  async listarPorStatus(status: 'PENDENTE' | 'RESOLVIDA') {
    const [todas, resolvidas] = await Promise.all([
      this.calcularTodas(),
      this.carregarResolvidas(),
    ]);

    const doStatus = todas.filter((p) => {
      const chave = `${p.alunoId}:${p.materiaId}`;
      return status === 'RESOLVIDA'
        ? resolvidas.has(chave)
        : !resolvidas.has(chave);
    });

    const porAluno = new Map<
      string,
      { nome: string; matricula: string; total: number }
    >();
    for (const p of doStatus) {
      const atual = porAluno.get(p.alunoId) ?? {
        nome: p.alunoNome,
        matricula: p.matricula,
        total: 0,
      };
      atual.total += 1;
      porAluno.set(p.alunoId, atual);
    }

    if (porAluno.size === 0) return [];
    const fotos = await this.prisma.aluno.findMany({
      where: { id: { in: [...porAluno.keys()] } },
      select: { id: true, user: { select: { fotoUrl: true } } },
    });
    const fotoPorAluno = new Map(fotos.map((a) => [a.id, a.user.fotoUrl]));

    return [...porAluno.entries()].map(([alunoId, info]) => ({
      id: alunoId,
      nome: info.nome,
      matricula: info.matricula,
      fotoUrl: fotoPorAluno.get(alunoId) ?? null,
      totalPendencias: info.total,
    }));
  }

  /** Todas as pendências de UM aluno (nas duas situações), pro popup — o admin precisa ver o
   * quadro completo do aluno, não só as do status da aba onde ele estava. */
  async pendenciasDoAluno(alunoId: string) {
    const [todas, resolvidas] = await Promise.all([
      this.calcularTodas(),
      this.carregarResolvidas(),
    ]);
    return todas
      .filter((p) => p.alunoId === alunoId)
      .map((p) => ({
        materiaId: p.materiaId,
        materiaNome: p.materiaNome,
        semestreNome: p.semestreNome,
        notaFinal: p.notaFinal,
        resolvida: resolvidas.has(`${p.alunoId}:${p.materiaId}`),
      }));
  }

  async resolver(alunoId: string, materiaId: string) {
    await this.prisma.pendenciaResolvida.upsert({
      where: { alunoId_materiaId: { alunoId, materiaId } },
      create: { alunoId, materiaId },
      update: {},
    });
    return { resolvida: true };
  }

  /** Resolve de uma vez todas as pendências ainda pendentes de um aluno — usado pela seleção
   * em massa da tabela (marcar vários alunos como resolvidos sem abrir o popup de cada um). */
  async resolverTodasDoAluno(alunoId: string) {
    const pendencias = await this.pendenciasDoAluno(alunoId);
    const pendentes = pendencias.filter((p) => !p.resolvida);
    if (pendentes.length > 0) {
      await this.prisma.$transaction(
        pendentes.map((p) =>
          this.prisma.pendenciaResolvida.upsert({
            where: {
              alunoId_materiaId: { alunoId, materiaId: p.materiaId },
            },
            create: { alunoId, materiaId: p.materiaId },
            update: {},
          }),
        ),
      );
    }
    return { resolvidas: pendentes.length };
  }

  async relatorio(
    formato: Formato,
    status: 'PENDENTE' | 'RESOLVIDA' = 'PENDENTE',
  ) {
    const [todas, resolvidas] = await Promise.all([
      this.calcularTodas(),
      this.carregarResolvidas(),
    ]);
    const doStatus = todas.filter((p) => {
      const chave = `${p.alunoId}:${p.materiaId}`;
      return status === 'RESOLVIDA'
        ? resolvidas.has(chave)
        : !resolvidas.has(chave);
    });
    const tabela: TabelaRelatorio = {
      titulo: `Relatório de pendências (${status === 'RESOLVIDA' ? 'resolvidas' : 'pendentes'})`,
      colunas: ['Nome', 'Matrícula', 'Semestre', 'Disciplina', 'Nota'],
      linhas: doStatus.map((p) => [
        p.alunoNome,
        p.matricula,
        p.semestreNome,
        p.materiaNome,
        p.notaFinal,
      ]),
    };
    return {
      buffer: await gerarRelatorio(tabela, formato),
      nomeBase: 'pendencias',
    };
  }
}
