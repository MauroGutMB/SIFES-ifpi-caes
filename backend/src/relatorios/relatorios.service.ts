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
import { Formato, gerarRelatorio, TabelaRelatorio } from './report-render.util';

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
      titulo: `Diario de aula - ${materia.professor.nome}`,
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
        vinculo.materia.turma.cursoTecnico,
        vinculo.materia.turma.anoSerie,
        linha?.situacao ?? 'CURSANDO',
        linha?.notaFinal ?? 0,
        linha?.frequenciaPercentual ?? 100,
      ]);
    }

    const tabela: TabelaRelatorio = {
      titulo: `Boletim - ${aluno.nome} (${aluno.matricula})`,
      colunas: ['Curso', 'Turma', 'Situacao', 'Nota Final', 'Frequencia %'],
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
          vinculo.materiaId,
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
        'Materia (id)',
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
      titulo: `Frequencia consolidada - Materia ${materia.diaSemana} ${materia.horaInicio}`,
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
          materia.id,
          b.frequenciaPercentual,
        ]);
      }
    }

    const tabela: TabelaRelatorio = {
      titulo: `Frequencia consolidada - Turma ${turma.cursoTecnico} ${turma.anoSerie}`,
      colunas: ['Aluno', 'Matricula', 'Materia (id)', 'Frequencia %'],
      linhas,
    };
    return {
      buffer: await gerarRelatorio(tabela, formato),
      nomeBase: 'frequencia-turma',
    };
  }
}
