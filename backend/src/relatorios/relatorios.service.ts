import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/auth.types';
import { Role } from '../../generated/prisma/client';
import { BoletimService } from '../boletim/boletim.service';
import { garantirPosseProfessor } from '../common/posse.util';
import { hojeComoBrasiliaFake } from '../common/tempo.util';
import { calcularFrequenciaPercentual } from '../boletim/boletim.util';
import { Formato, gerarRelatorio, TabelaRelatorio } from './report-render.util';
import type { RelatorioFrequenciaTurmaDto } from './dto/frequencia-turma-relatorio.dto';

export interface FiltrosFrequenciaTurma {
  materiaId?: string;
  alunoId?: string;
  dataInicio?: string;
  dataFim?: string;
}

@Injectable()
export class RelatoriosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly boletim: BoletimService,
  ) {}

  private async carregarMateriaComPosse(
    materiaId: string,
    user: AuthenticatedUser,
  ) {
    const materia = await this.prisma.materia.findUnique({
      where: { id: materiaId },
      include: { turma: true, professor: true },
    });
    if (!materia) {
      throw new NotFoundException('Matéria não encontrada');
    }
    garantirPosseProfessor(user, materia.professorId, 'Matéria não encontrada');
    return materia;
  }

  async diarioMateria(
    materiaId: string,
    formato: Formato,
    user: AuthenticatedUser,
  ) {
    const materia = await this.carregarMateriaComPosse(materiaId, user);

    const aulas = await this.prisma.aula.findMany({
      where: { materiaId },
      include: { frequencias: { include: { aluno: true } } },
      orderBy: { data: 'asc' },
    });

    const linhas: (string | number)[][] = [];
    for (const aula of aulas) {
      const dataStr = aula.data.toISOString().slice(0, 10);
      if (aula.frequencias.length === 0) {
        linhas.push([
          dataStr,
          aula.titulo ?? '',
          aula.descricao ?? '',
          '—',
          '—',
          '—',
        ]);
        continue;
      }
      for (const f of aula.frequencias) {
        linhas.push([
          dataStr,
          aula.titulo ?? '',
          aula.descricao ?? '',
          f.aluno.nome,
          f.aluno.matricula,
          f.status,
        ]);
      }
    }

    const tabela: TabelaRelatorio = {
      titulo: `Diario de aula - ${materia.nome} (${materia.professor.nome})`,
      colunas: [
        'Data',
        'Titulo',
        'Descricao',
        'Aluno',
        'Matricula',
        'Frequencia',
      ],
      linhas,
    };
    return {
      buffer: await gerarRelatorio(tabela, formato),
      nomeBase: 'diario-aula',
    };
  }

  async boletimAluno(
    alunoId: string,
    formato: Formato,
    user: AuthenticatedUser,
    semestreId?: string,
  ) {
    if (user.role === Role.ALUNO && user.alunoId !== alunoId) {
      throw new NotFoundException('Aluno não encontrado');
    }
    const aluno = await this.prisma.aluno.findUnique({
      where: { id: alunoId },
    });
    if (!aluno) {
      throw new NotFoundException('Aluno não encontrado');
    }

    const vinculos = await this.prisma.vinculoAlunoMateria.findMany({
      where: {
        alunoId,
        materia: semestreId ? { turma: { semestreId } } : undefined,
      },
      include: { materia: { include: { turma: true } } },
    });

    const linhas: (string | number)[][] = [];
    for (const vinculo of vinculos) {
      const boletim = await this.boletim.calcularBoletimMateria(
        vinculo.materiaId,
      );
      const linha = boletim.find((b) => b.aluno.id === alunoId);
      linhas.push([
        vinculo.materia.nome,
        vinculo.materia.turma.cursoTecnico,
        vinculo.materia.turma.anoSerie,
        linha?.situacao ?? 'CURSANDO',
        linha?.notaFinal ?? 0,
        linha?.frequenciaPercentual ?? 100,
      ]);
    }

    const tabela: TabelaRelatorio = {
      titulo: `Boletim - ${aluno.nome} (${aluno.matricula})`,
      colunas: [
        'Materia',
        'Curso',
        'Turma',
        'Situacao',
        'Nota Final',
        'Frequencia %',
      ],
      linhas,
    };
    return {
      buffer: await gerarRelatorio(tabela, formato),
      nomeBase: 'boletim',
    };
  }

  async listaTurma(turmaId: string, formato: Formato) {
    const turma = await this.prisma.turma.findUnique({
      where: { id: turmaId },
      include: { alunos: true, materias: true },
    });
    if (!turma) {
      throw new NotFoundException('Turma não encontrada');
    }

    const linhas: (string | number)[][] = [];
    for (const aluno of turma.alunos) {
      const vinculos = await this.prisma.vinculoAlunoMateria.findMany({
        where: {
          alunoId: aluno.id,
          materiaId: { in: turma.materias.map((m) => m.id) },
        },
        include: { materia: true },
      });
      if (vinculos.length === 0) {
        linhas.push([aluno.nome, aluno.matricula, '—', '—', '—', '—']);
        continue;
      }
      for (const vinculo of vinculos) {
        const boletim = await this.boletim.calcularBoletimMateria(
          vinculo.materiaId,
        );
        const linha = boletim.find((b) => b.aluno.id === aluno.id);
        linhas.push([
          aluno.nome,
          aluno.matricula,
          vinculo.materia.nome,
          linha?.situacao ?? 'CURSANDO',
          linha?.notaFinal ?? 0,
          linha?.frequenciaPercentual ?? 100,
        ]);
      }
    }

    const tabela: TabelaRelatorio = {
      titulo: `Lista de turma - ${turma.cursoTecnico} ${turma.anoSerie}`,
      colunas: [
        'Aluno',
        'Matricula',
        'Materia',
        'Situacao',
        'Nota Final',
        'Frequencia %',
      ],
      linhas,
    };
    return {
      buffer: await gerarRelatorio(tabela, formato),
      nomeBase: 'lista-turma',
    };
  }

  async frequenciaMateria(
    materiaId: string,
    formato: Formato,
    user: AuthenticatedUser,
  ) {
    const materia = await this.carregarMateriaComPosse(materiaId, user);
    const boletim = await this.boletim.calcularBoletimMateria(materiaId);

    const tabela: TabelaRelatorio = {
      titulo: `Frequencia consolidada - ${materia.nome}`,
      colunas: ['Aluno', 'Matricula', 'Frequencia %'],
      linhas: boletim.map((b) => [
        b.aluno.nome,
        b.aluno.matricula,
        b.frequenciaPercentual,
      ]),
    };
    return {
      buffer: await gerarRelatorio(tabela, formato),
      nomeBase: 'frequencia-materia',
    };
  }

  async frequenciaTurma(turmaId: string, formato: Formato) {
    const turma = await this.prisma.turma.findUnique({
      where: { id: turmaId },
      include: { materias: true },
    });
    if (!turma) {
      throw new NotFoundException('Turma não encontrada');
    }
    if (turma.materias.length === 0) {
      throw new BadRequestException('Turma não possui Matérias cadastradas');
    }

    const linhas: (string | number)[][] = [];
    for (const materia of turma.materias) {
      const boletim = await this.boletim.calcularBoletimMateria(materia.id);
      for (const b of boletim) {
        linhas.push([
          b.aluno.nome,
          b.aluno.matricula,
          materia.nome,
          b.frequenciaPercentual,
        ]);
      }
    }

    const tabela: TabelaRelatorio = {
      titulo: `Frequencia consolidada - Turma ${turma.cursoTecnico} ${turma.anoSerie}`,
      colunas: ['Aluno', 'Matricula', 'Materia', 'Frequencia %'],
      linhas,
    };
    return {
      buffer: await gerarRelatorio(tabela, formato),
      nomeBase: 'frequencia-turma',
    };
  }

  /** Painel de frequência da turma — exibível na tela, com filtros por matéria, aluno e
   * intervalo de datas. Sem filtro de data, o padrão é "até hoje" (nunca antecipa aulas
   * futuras, que ainda não têm frequência lançada). */
  async frequenciaTurmaDetalhada(
    turmaId: string,
    user: AuthenticatedUser,
    filtros: FiltrosFrequenciaTurma,
  ): Promise<RelatorioFrequenciaTurmaDto> {
    const turma = await this.prisma.turma.findUnique({
      where: { id: turmaId },
      include: { materias: true },
    });
    if (!turma) {
      throw new NotFoundException('Turma não encontrada');
    }

    let materias = turma.materias;
    let alunoIdForcado: string | undefined;
    if (user.role === Role.PROFESSOR) {
      materias = materias.filter((m) => m.professorId === user.professorId);
    } else if (user.role === Role.ALUNO) {
      const vinculosDoAluno = await this.prisma.vinculoAlunoMateria.findMany({
        where: {
          alunoId: user.alunoId,
          materiaId: { in: materias.map((m) => m.id) },
        },
        select: { materiaId: true },
      });
      const idsPermitidos = new Set(vinculosDoAluno.map((v) => v.materiaId));
      materias = materias.filter((m) => idsPermitidos.has(m.id));
      alunoIdForcado = user.alunoId;
    }
    if (filtros.materiaId) {
      materias = materias.filter((m) => m.id === filtros.materiaId);
    }
    if (materias.length === 0) {
      throw new NotFoundException('Turma não encontrada');
    }
    const alunoIdFiltro = alunoIdForcado ?? filtros.alunoId;
    const materiaIds = materias.map((m) => m.id);
    const nomePorMateria = new Map(materias.map((m) => [m.id, m.nome]));

    const hoje = hojeComoBrasiliaFake();
    const dataFim = filtros.dataFim ? new Date(filtros.dataFim) : hoje;
    const dataFimEfetiva = dataFim.getTime() < hoje.getTime() ? dataFim : hoje;

    const aulas = await this.prisma.aula.findMany({
      where: {
        materiaId: { in: materiaIds },
        data: {
          gte: filtros.dataInicio ? new Date(filtros.dataInicio) : undefined,
          lte: dataFimEfetiva,
        },
      },
      include: {
        frequencias: {
          where: alunoIdFiltro ? { alunoId: alunoIdFiltro } : undefined,
          include: {
            aluno: { select: { id: true, nome: true, matricula: true } },
          },
        },
      },
      orderBy: { data: 'asc' },
    });

    const detalhado = aulas.flatMap((aula) =>
      aula.frequencias.map((f) => ({
        data: aula.data,
        materiaId: aula.materiaId,
        materiaNome: nomePorMateria.get(aula.materiaId) ?? '',
        alunoId: f.alunoId,
        alunoNome: f.aluno.nome,
        matricula: f.aluno.matricula,
        status: f.status,
      })),
    );

    const vinculados = await this.prisma.vinculoAlunoMateria.findMany({
      where: {
        materiaId: { in: materiaIds },
        alunoId: alunoIdFiltro,
      },
      include: { aluno: { select: { id: true, nome: true, matricula: true } } },
    });

    const resumo: RelatorioFrequenciaTurmaDto['resumo'] = vinculados.map(
      (vinculo) => {
        const doAluno = detalhado.filter(
          (l) =>
            l.materiaId === vinculo.materiaId && l.alunoId === vinculo.alunoId,
        );
        return {
          alunoId: vinculo.alunoId,
          alunoNome: vinculo.aluno.nome,
          matricula: vinculo.aluno.matricula,
          materiaId: vinculo.materiaId,
          materiaNome: nomePorMateria.get(vinculo.materiaId) ?? '',
          frequenciaPercentual: Number(
            calcularFrequenciaPercentual(doAluno).toFixed(2),
          ),
        };
      },
    );

    return {
      materias: materias.map((m) => ({ id: m.id, nome: m.nome })),
      resumo,
      detalhado,
    };
  }
}
