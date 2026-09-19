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
      throw new NotFoundException('Disciplina não encontrada');
    }
    garantirPosseProfessor(
      user,
      materia.professorId,
      'Disciplina não encontrada',
    );
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
      subtitulo: `Turma: ${materia.turma.cursoTecnico} — ${materia.turma.anoSerie}`,
      colunas: [
        'Data',
        'Titulo',
        'Descricao',
        'Aluno',
        'Matricula',
        'Presenca',
      ],
      colunasAgrupadas: [0, 1, 2],
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
      include: { turma: true },
    });
    if (!aluno) {
      throw new NotFoundException('Aluno não encontrado');
    }

    const vinculos = await this.prisma.vinculoAlunoMateria.findMany({
      where: {
        alunoId,
        materia: semestreId ? { turma: { semestreId } } : undefined,
      },
      include: {
        materia: { include: { turma: { include: { semestre: true } } } },
      },
    });

    const linhasPorSemestre = new Map<
      string,
      { nome: string; dataInicio: Date; linhas: (string | number)[][] }
    >();
    for (const vinculo of vinculos) {
      const boletim = await this.boletim.calcularBoletimMateria(
        vinculo.materiaId,
      );
      const linha = boletim.find((b) => b.aluno.id === alunoId);
      const semestre = vinculo.materia.turma.semestre;
      const grupo = linhasPorSemestre.get(semestre.id) ?? {
        nome: semestre.nome,
        dataInicio: semestre.dataInicio,
        linhas: [],
      };
      grupo.linhas.push([
        vinculo.materia.nome,
        vinculo.materia.turma.cursoTecnico,
        vinculo.materia.turma.anoSerie,
        linha?.situacao ?? 'CURSANDO',
        linha?.notaFinal ?? 0,
        linha?.frequenciaPercentual ?? 100,
      ]);
      linhasPorSemestre.set(semestre.id, grupo);
    }
    const secoes = [...linhasPorSemestre.values()]
      .sort((a, b) => a.dataInicio.getTime() - b.dataInicio.getTime())
      .map((grupo) => ({ titulo: grupo.nome, linhas: grupo.linhas }));

    const tabela: TabelaRelatorio = {
      titulo: `Boletim - ${aluno.nome} (${aluno.matricula})`,
      subtitulo: aluno.turma
        ? `Turma: ${aluno.turma.cursoTecnico} — ${aluno.turma.anoSerie}`
        : undefined,
      colunas: [
        'Disciplina',
        'Curso',
        'Turma',
        'Situacao',
        'Nota Final',
        'Frequencia %',
      ],
      linhas: secoes.flatMap((s) => s.linhas),
      secoes,
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
      subtitulo: `Turma: ${turma.cursoTecnico} — ${turma.anoSerie}`,
      colunas: [
        'Aluno',
        'Matricula',
        'Disciplina',
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
      subtitulo: `Turma: ${materia.turma.cursoTecnico} — ${materia.turma.anoSerie}`,
      colunas: ['Aluno', 'Matricula', 'Faltas', 'Frequencia %'],
      linhas: boletim.map((b) => [
        b.aluno.nome,
        b.aluno.matricula,
        b.faltas,
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
      throw new BadRequestException('Turma não possui Disciplinas cadastradas');
    }

    const linhas: (string | number)[][] = [];
    for (const materia of turma.materias) {
      const boletim = await this.boletim.calcularBoletimMateria(materia.id);
      for (const b of boletim) {
        linhas.push([
          b.aluno.nome,
          b.aluno.matricula,
          materia.nome,
          b.faltas,
          b.frequenciaPercentual,
        ]);
      }
    }

    const tabela: TabelaRelatorio = {
      titulo: `Frequencia consolidada - Turma ${turma.cursoTecnico} ${turma.anoSerie}`,
      subtitulo: `Turma: ${turma.cursoTecnico} — ${turma.anoSerie}`,
      colunas: ['Aluno', 'Matricula', 'Disciplina', 'Faltas', 'Frequencia %'],
      linhas,
    };
    return {
      buffer: await gerarRelatorio(tabela, formato),
      nomeBase: 'frequencia-turma',
    };
  }

  /** Agenda semanal (dia + horário de cada disciplina) de quem está pedindo — professor vê as
   * disciplinas que ministra, aluno vê as que está vinculado. Mesma fonte de dado que já
   * alimenta o card "Agenda da semana" do início de cada um (GET /materias). */
  async agendaSemanal(formato: Formato, user: AuthenticatedUser) {
    if (user.role !== Role.PROFESSOR && user.role !== Role.ALUNO) {
      throw new BadRequestException(
        'Agenda semanal só está disponível para professor ou aluno',
      );
    }

    const materias = await this.prisma.materia.findMany({
      where: {
        // A agenda é o horário de aulas em curso — matéria encerrada usa os mesmos slots de
        // dia/hora de sempre (ex: sempre Segunda 08h pro turno da manhã), então incluí-la
        // faria duas disciplinas de semestres diferentes aparecerem empilhadas na mesma célula.
        estado: 'ABERTA',
        professorId:
          user.role === Role.PROFESSOR ? user.professorId : undefined,
        vinculos:
          user.role === Role.ALUNO
            ? { some: { alunoId: user.alunoId } }
            : undefined,
      },
      include: { turma: true, professor: true, horarios: true },
      orderBy: { nome: 'asc' },
    });

    const ORDEM_DIA: Record<string, number> = {
      SEGUNDA: 1,
      TERCA: 2,
      QUARTA: 3,
      QUINTA: 4,
      SEXTA: 5,
      SABADO: 6,
    };
    const LABEL_DIA: Record<string, string> = {
      SEGUNDA: 'Segunda-feira',
      TERCA: 'Terça-feira',
      QUARTA: 'Quarta-feira',
      QUINTA: 'Quinta-feira',
      SEXTA: 'Sexta-feira',
      SABADO: 'Sábado',
    };

    // Mesma grade dia x hora mostrada no WeeklyAgenda da tela (7h-17h, Sábado só entra se
    // houver aula nele) — em vez da lista simples de linhas do relatório genérico.
    const HORAS = Array.from({ length: 11 }, (_, i) => 7 + i);
    const diasComAula = new Set(
      materias.flatMap((m) => m.horarios.map((h) => h.diaSemana)),
    );
    const dias = Object.keys(ORDEM_DIA)
      .filter((d) => d !== 'SABADO' || diasComAula.has('SABADO'))
      .sort((a, b) => ORDEM_DIA[a] - ORDEM_DIA[b]);

    // Professor pode lecionar em turmas diferentes — mostra a turma junto na célula, igual à
    // tela (mostrarTurma). Aluno só tem uma turma, então ela vai só no cabeçalho do relatório.
    const celula = (dia: string, hora: number): string =>
      materias
        .filter((m) =>
          m.horarios.some(
            (h) =>
              h.diaSemana === dia && Number(h.horaInicio.slice(0, 2)) === hora,
          ),
        )
        .map((m) =>
          user.role === Role.PROFESSOR
            ? `${m.nome} — ${m.turma.cursoTecnico} ${m.turma.anoSerie}`
            : m.nome,
        )
        .join(' / ');

    const turmas = [
      ...new Set(
        materias.map((m) => `${m.turma.cursoTecnico} — ${m.turma.anoSerie}`),
      ),
    ];

    // Professor pode lecionar em várias turmas — listar todas soltas no cabeçalho (área de
    // altura fixa, ao lado dos logos) quebra o layout quando são muitas. Em vez disso, o
    // cabeçalho mostra só "Agenda da semana" (tamanho constante) e a lista turma→horários vira
    // uma legenda no corpo do documento, que pode crescer livremente sem estourar nada.
    const DIA_ABREV: Record<string, string> = {
      SEGUNDA: 'Seg',
      TERCA: 'Ter',
      QUARTA: 'Qua',
      QUINTA: 'Qui',
      SEXTA: 'Sex',
      SABADO: 'Sáb',
    };
    const horariosPorTurma = new Map<
      string,
      { diaSemana: string; horaInicio: string }[]
    >();
    for (const materia of materias) {
      const turmaLabel = `${materia.turma.cursoTecnico} — ${materia.turma.anoSerie}`;
      const lista = horariosPorTurma.get(turmaLabel) ?? [];
      lista.push(...materia.horarios);
      horariosPorTurma.set(turmaLabel, lista);
    }
    const legendaTurmas = [...horariosPorTurma.entries()].map(
      ([turma, horarios]) => {
        const unicos = [
          ...new Set(
            horarios
              .sort(
                (a, b) =>
                  ORDEM_DIA[a.diaSemana] - ORDEM_DIA[b.diaSemana] ||
                  a.horaInicio.localeCompare(b.horaInicio),
              )
              .map(
                (h) =>
                  `${DIA_ABREV[h.diaSemana] ?? h.diaSemana} ${h.horaInicio.slice(0, 2)}h`,
              ),
          ),
        ];
        return `${turma}: ${unicos.join(', ')}`;
      },
    );

    const tabela: TabelaRelatorio = {
      titulo: 'Agenda da semana',
      subtitulo:
        user.role === Role.PROFESSOR
          ? 'Agenda da semana'
          : (turmas[0] ?? undefined),
      legenda: user.role === Role.PROFESSOR ? legendaTurmas : undefined,
      tituloAlinhamento: 'center',
      colunas: ['Hora', ...dias.map((d) => LABEL_DIA[d])],
      linhas: HORAS.map((hora) => [
        `${String(hora).padStart(2, '0')}h`,
        ...dias.map((dia) => celula(dia, hora)),
      ]),
    };
    return {
      buffer: await gerarRelatorio(tabela, formato),
      nomeBase: 'agenda-semanal',
    };
  }

  /** Usuários com senha já definida (precisaTrocarSenha=false) — os que ainda não trocaram a
   * senha inicial não entram, pois ainda não estão de fato "ativos" no sistema. */
  async usuariosAtivos(formato: Formato, role?: Role) {
    const usuarios = await this.prisma.user.findMany({
      where: { precisaTrocarSenha: false, role },
      include: {
        professor: { select: { nome: true } },
        aluno: { select: { nome: true } },
      },
      orderBy: { criadoEm: 'desc' },
    });

    const tabela: TabelaRelatorio = {
      titulo: 'Usuários com senha definida',
      colunas: ['Nome', 'Login', 'Cargo', 'Criado em'],
      linhas: usuarios.map((u) => [
        u.professor?.nome ?? u.aluno?.nome ?? '—',
        u.login,
        u.role,
        u.criadoEm.toISOString().slice(0, 10),
      ]),
    };
    return {
      buffer: await gerarRelatorio(tabela, formato),
      nomeBase: 'usuarios',
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
        aulaId: aula.id,
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
      include: {
        aluno: {
          select: {
            id: true,
            nome: true,
            matricula: true,
            user: { select: { fotoUrl: true } },
          },
        },
      },
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
          fotoUrl: vinculo.aluno.user.fotoUrl,
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

  /** Exporta a frequência da turma com uma tabela por Disciplina (respeita os mesmos filtros
   * da tela: disciplina, aluno, intervalo de datas) — reaproveita o mesmo cálculo de
   * frequenciaTurmaDetalhada, só reagrupa o resultado por Disciplina em vez de por aluno. */
  async frequenciaTurmaPorDisciplina(
    turmaId: string,
    formato: Formato,
    user: AuthenticatedUser,
    filtros: FiltrosFrequenciaTurma,
  ) {
    const [turma, { resumo, detalhado }] = await Promise.all([
      this.prisma.turma.findUnique({ where: { id: turmaId } }),
      this.frequenciaTurmaDetalhada(turmaId, user, filtros),
    ]);

    const contagemPorMateriaAluno = new Map<
      string,
      { presentes: number; faltas: number; total: number }
    >();
    for (const linha of detalhado) {
      const chave = `${linha.materiaId}:${linha.alunoId}`;
      const atual = contagemPorMateriaAluno.get(chave) ?? {
        presentes: 0,
        faltas: 0,
        total: 0,
      };
      atual.total += 1;
      if (linha.status === 'PRESENTE') atual.presentes += 1;
      else if (linha.status === 'FALTA') atual.faltas += 1;
      contagemPorMateriaAluno.set(chave, atual);
    }

    const porMateria = new Map<
      string,
      { titulo: string; linhas: (string | number)[][] }
    >();
    for (const linha of resumo) {
      const grupo = porMateria.get(linha.materiaId) ?? {
        titulo: linha.materiaNome,
        linhas: [],
      };
      const contagem = contagemPorMateriaAluno.get(
        `${linha.materiaId}:${linha.alunoId}`,
      ) ?? { presentes: 0, faltas: 0, total: 0 };
      grupo.linhas.push([
        linha.alunoNome,
        Number(linha.frequenciaPercentual.toFixed(1)),
        contagem.faltas,
        contagem.presentes,
        contagem.total,
      ]);
      porMateria.set(linha.materiaId, grupo);
    }

    const secoes = [...porMateria.values()];
    const tabela: TabelaRelatorio = {
      titulo: 'Frequência por disciplina',
      subtitulo: turma
        ? `${turma.cursoTecnico} — ${turma.anoSerie}`
        : undefined,
      tituloAlinhamento: 'center',
      colunas: [
        'Aluno',
        'Frequência (%)',
        'Faltas',
        'Presenças',
        'Número total de aulas',
      ],
      linhas: secoes.flatMap((s) => s.linhas),
      secoes,
    };
    return {
      buffer: await gerarRelatorio(tabela, formato),
      nomeBase: 'frequencia-turma-disciplinas',
    };
  }
}
