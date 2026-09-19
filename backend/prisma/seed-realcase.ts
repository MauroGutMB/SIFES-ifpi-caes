/**
 * Popula o banco com um cenário acadêmico realista de DOIS semestres pra testes manuais/demo:
 *   - 2025/1: encerrado — todas as Matérias ENCERRADA, com notas e frequência completas, pra
 *     conferir boletins/situação/pendências já fechados.
 *   - 2025/2: em andamento — mesmas 5 turmas (continuação), Matérias ABERTA, com aulas e
 *     frequência lançadas só até hoje, e só a primeira prova lançada (a segunda fica "não
 *     lançada" de propósito).
 * 20 professores, 5 turmas (2 manhã, 3 tarde) com 10 matérias cada, ~30 alunos por turma
 * (mesmos alunos nos dois semestres). Não roda de novo se já existir — rode
 * `db-util.sh --reset-db` antes se quiser popular de novo do zero.
 */
import {
  PrismaClient,
  DiaSemana,
  StatusFrequencia,
  Turno,
} from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import { gerarOcorrenciasAula } from '../src/materias/horario.util';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const NOME_SEMESTRE_1 = '2025/1';
const NOME_SEMESTRE_2 = '2025/2';
const ALUNOS_POR_TURMA = 30;
const SENHA_DEMO = 'demo1234';

function addDias(data: Date, dias: number): Date {
  const resultado = new Date(data);
  resultado.setUTCDate(resultado.getUTCDate() + dias);
  return resultado;
}

function aleatorioEntre(min: number, max: number): number {
  return Math.round((min + Math.random() * (max - min)) * 100) / 100;
}

/** Nota de uma prova a partir do nível fixo do aluno, com uma variação pequena — mantém notas
 * de um mesmo aluno correlacionadas entre matérias/provas, como no mundo real. */
function notaComRuido(nivelBase: number): number {
  const valor = nivelBase + aleatorioEntre(-1, 1);
  return Math.round(Math.min(10, Math.max(0, valor)) * 100) / 100;
}

function statusAleatorio(): StatusFrequencia {
  const r = Math.random();
  if (r < 0.85) return StatusFrequencia.PRESENTE;
  if (r < 0.95) return StatusFrequencia.FALTA;
  return StatusFrequencia.FALTA_JUSTIFICADA;
}

/** Remove acentos e normaliza pra formar login/e-mail — evita depender de uma lib só pra isso. */
function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

const PRIMEIROS_NOMES = [
  'Ana', 'Beatriz', 'Carlos', 'Daniela', 'Eduardo', 'Fernanda', 'Gabriel', 'Helena',
  'Igor', 'Juliana', 'Lucas', 'Mariana', 'Nicolas', 'Otavio', 'Patricia', 'Rafael',
  'Sabrina', 'Tiago', 'Vanessa', 'Wesley', 'Camila', 'Diego', 'Elaine', 'Felipe',
  'Gisele', 'Henrique', 'Isabela', 'Joao', 'Karina', 'Leandro', 'Marcos', 'Natalia',
  'Paulo', 'Renata', 'Sergio', 'Tatiane', 'Vinicius', 'Yasmin', 'Bruno', 'Cristina',
];
const SOBRENOMES = [
  'Silva', 'Souza', 'Oliveira', 'Santos', 'Pereira', 'Costa', 'Rodrigues', 'Almeida',
  'Nascimento', 'Lima', 'Araujo', 'Fernandes', 'Carvalho', 'Gomes', 'Martins', 'Rocha',
  'Ribeiro', 'Alves', 'Monteiro', 'Barbosa', 'Cardoso', 'Teixeira', 'Correia', 'Mendes',
  'Freitas', 'Machado', 'Moreira', 'Batista', 'Dias', 'Pinto',
];

/** Gera um nome completo determinístico (sem colisão) a partir de um índice global —
 * `grupo` separa os "espaços" de índice de professores/alunos pra eles nunca coincidirem. */
function nomeCompleto(indice: number, grupo: number): string {
  const i = indice + grupo * 10_000;
  const primeiro = PRIMEIROS_NOMES[i % PRIMEIROS_NOMES.length];
  const sobrenome1 = SOBRENOMES[Math.floor(i / PRIMEIROS_NOMES.length) % SOBRENOMES.length];
  const sobrenome2 =
    SOBRENOMES[(Math.floor(i / PRIMEIROS_NOMES.length) + 11) % SOBRENOMES.length];
  return `${primeiro} ${sobrenome1} ${sobrenome2}`;
}

async function criarUsuario(login: string, role: 'PROFESSOR' | 'ALUNO') {
  const senhaHash = await bcrypt.hash(SENHA_DEMO, 10);
  return prisma.user.create({
    data: { login, senhaHash, role, precisaTrocarSenha: false },
  });
}

/** Gera as Aulas de uma Matéria pro intervalo do próprio Semestre — só cria Frequencia pras
 * ocorrências até `cutoff` (semestre encerrado: cutoff = fim do semestre, todas recebem
 * frequência; semestre em andamento: cutoff = hoje de verdade, só o que já rolou). */
async function gerarAulasEFrequencia(
  materiaId: string,
  alunoIds: string[],
  cutoff: Date,
) {
  const materia = await prisma.materia.findUniqueOrThrow({
    where: { id: materiaId },
    include: { turma: { include: { semestre: true } }, horarios: true },
  });
  const ocorrencias = materia.horarios.flatMap((horario) =>
    gerarOcorrenciasAula(
      materia.turma.semestre.dataInicio,
      materia.turma.semestre.dataFim,
      horario.diaSemana,
      horario.horaInicio,
    ),
  );

  for (const ocorrencia of ocorrencias) {
    const jaAconteceu = ocorrencia.data <= cutoff;
    const aula = await prisma.aula.create({
      data: {
        materiaId,
        data: ocorrencia.data,
        horaInicio: ocorrencia.horaInicio,
        horaFim: ocorrencia.horaFim,
        titulo: jaAconteceu ? 'Aula lançada (demo)' : null,
        descricao: jaAconteceu ? 'Conteúdo gerado pelo populate-realcase.' : null,
      },
    });
    if (jaAconteceu) {
      await prisma.frequencia.createMany({
        data: alunoIds.map((alunoId) => ({
          aulaId: aula.id,
          alunoId,
          status: statusAleatorio(),
        })),
      });
    }
  }
}

interface Grupo {
  cursoTecnico: string;
  anoSerie: string;
  turno: Turno;
  tecnicas: [string, string];
}

const GRUPOS: Grupo[] = [
  { cursoTecnico: 'Informática', anoSerie: '1º Ano', turno: Turno.MANHA, tecnicas: ['Programação', 'Redes de Computadores'] },
  { cursoTecnico: 'Agropecuária', anoSerie: '1º Ano', turno: Turno.MANHA, tecnicas: ['Zootecnia', 'Agroecologia'] },
  { cursoTecnico: 'Enfermagem', anoSerie: '2º Ano', turno: Turno.TARDE, tecnicas: ['Anatomia e Fisiologia', 'Primeiros Socorros'] },
  { cursoTecnico: 'Administração', anoSerie: '2º Ano', turno: Turno.TARDE, tecnicas: ['Contabilidade Básica', 'Gestão de Pessoas'] },
  { cursoTecnico: 'Meio Ambiente', anoSerie: '3º Ano', turno: Turno.TARDE, tecnicas: ['Gestão Ambiental', 'Educação Ambiental'] },
];

const DISCIPLINAS_NUCLEO = [
  'Matemática', 'Português', 'História', 'Geografia', 'Biologia', 'Física', 'Química', 'Inglês',
];

/** Janela de horário por turno — manhã usa 07h-11h, tarde usa 13h-17h (5 horários cada). */
const DIAS_UTEIS = [DiaSemana.SEGUNDA, DiaSemana.TERCA, DiaSemana.QUARTA, DiaSemana.QUINTA, DiaSemana.SEXTA];
function horasPorTurno(turno: Turno): string[] {
  return turno === Turno.MANHA
    ? ['07:00', '08:00', '09:00', '10:00', '11:00']
    : ['13:00', '14:00', '15:00', '16:00', '17:00'];
}

/** 5 dias x 5 horários = 25 slots por turma — cada Matéria consome 2 (índices 2i, 2i+1),
 * então 10 Matérias usam 20 dos 25 sem nunca colidir dentro da mesma Turma. */
function slotsDaTurma(turno: Turno): { diaSemana: DiaSemana; horaInicio: string }[] {
  const horas = horasPorTurno(turno);
  return horas.flatMap((horaInicio) =>
    DIAS_UTEIS.map((diaSemana) => ({ diaSemana, horaInicio })),
  );
}

async function main() {
  const jaExiste = await prisma.semestre.findFirst({
    where: { nome: { in: [NOME_SEMESTRE_1, NOME_SEMESTRE_2] } },
  });
  if (jaExiste) {
    console.log(
      `Já existe um semestre "${jaExiste.nome}" — rode "db-util.sh --reset-db" antes de popular de novo.`,
    );
    return;
  }

  const hoje = new Date();
  hoje.setUTCHours(0, 0, 0, 0);

  const semestre1 = await prisma.semestre.create({
    data: { nome: NOME_SEMESTRE_1, dataInicio: addDias(hoje, -240), dataFim: addDias(hoje, -120) },
  });
  const semestre2 = await prisma.semestre.create({
    data: { nome: NOME_SEMESTRE_2, dataInicio: addDias(hoje, -60), dataFim: addDias(hoje, 90) },
  });

  // --- Turmas: uma linha por grupo em cada semestre (mesma identidade, continuação) ---
  const turmas1: string[] = [];
  const turmas2: string[] = [];
  for (const grupo of GRUPOS) {
    const t1 = await prisma.turma.create({
      data: { semestreId: semestre1.id, cursoTecnico: grupo.cursoTecnico, anoSerie: grupo.anoSerie, turno: grupo.turno },
    });
    const t2 = await prisma.turma.create({
      data: { semestreId: semestre2.id, cursoTecnico: grupo.cursoTecnico, anoSerie: grupo.anoSerie, turno: grupo.turno },
    });
    turmas1.push(t1.id);
    turmas2.push(t2.id);
  }

  // --- Professores: 20 no total — Matemática e Português com 2 cada (turmas divididas ao
  // meio), as outras 6 disciplinas de núcleo com 1 (dá aula nas 5 turmas), e 1 por técnica
  // (10 técnicas, só na turma do próprio grupo) = 2+2+6+10 = 20. ---
  interface ProfessorInfo { id: string; nome: string }
  async function criarProfessor(indice: number): Promise<ProfessorInfo> {
    const nome = nomeCompleto(indice, 1);
    const email = `${normalizar(nome).replace(/ /g, '.')}@ifpi.edu.br`;
    const user = await criarUsuario(email, 'PROFESSOR');
    const professor = await prisma.professor.create({ data: { userId: user.id, nome, email } });
    return { id: professor.id, nome };
  }

  let contadorProfessor = 0;
  const profMatematica = [await criarProfessor(contadorProfessor++), await criarProfessor(contadorProfessor++)];
  const profPortugues = [await criarProfessor(contadorProfessor++), await criarProfessor(contadorProfessor++)];
  const profsNucleoRestante: Record<string, ProfessorInfo> = {};
  for (const disciplina of DISCIPLINAS_NUCLEO.filter((d) => d !== 'Matemática' && d !== 'Português')) {
    profsNucleoRestante[disciplina] = await criarProfessor(contadorProfessor++);
  }
  const profsPorTecnica: Record<string, ProfessorInfo> = {};
  for (const grupo of GRUPOS) {
    for (const tecnica of grupo.tecnicas) {
      profsPorTecnica[tecnica] = await criarProfessor(contadorProfessor++);
    }
  }

  /** Professor responsável por uma disciplina numa turma (índice 0-4) específica. */
  function professorDaDisciplina(disciplina: string, indiceGrupo: number): ProfessorInfo {
    if (disciplina === 'Matemática') return indiceGrupo < 3 ? profMatematica[0] : profMatematica[1];
    if (disciplina === 'Português') return indiceGrupo < 3 ? profPortugues[0] : profPortugues[1];
    if (profsNucleoRestante[disciplina]) return profsNucleoRestante[disciplina];
    return profsPorTecnica[disciplina];
  }

  // --- Alunos: ~30 por turma, mesmos nos dois semestres (turmaId aponta pra turma ATUAL,
  // 2025/2 — o histórico de 2025/1 fica só no vínculo aluno-matéria). Cada aluno recebe um
  // "nível" de desempenho fixo (mesmo nos dois semestres, como na vida real) — a maioria boa
  // (quase sempre aprovada), uma minoria fraca (reprova em várias matérias). Notas totalmente
  // independentes por matéria dariam ~50% de reprovação por matéria isolada, e isso composto
  // em 10 matérias faria praticamente todo mundo cair em alguma — sem correlação por aluno,
  // "pendência" deixa de ser uma exceção e vira a regra.
  const nivelPorAluno = new Map<string, number>();
  const alunosPorGrupo: string[][] = GRUPOS.map(() => []);
  let contadorAluno = 0;
  for (let indiceGrupo = 0; indiceGrupo < GRUPOS.length; indiceGrupo++) {
    for (let i = 0; i < ALUNOS_POR_TURMA; i++) {
      const nome = nomeCompleto(contadorAluno, 2);
      const matricula = `2025${String(indiceGrupo + 1).padStart(2, '0')}${String(i + 1).padStart(3, '0')}`;
      const user = await criarUsuario(matricula, 'ALUNO');
      const aluno = await prisma.aluno.create({
        data: { userId: user.id, nome, matricula, turmaId: turmas2[indiceGrupo] },
      });
      nivelPorAluno.set(
        aluno.id,
        Math.random() < 0.18 ? aleatorioEntre(4, 6.2) : aleatorioEntre(7.8, 9.6),
      );
      alunosPorGrupo[indiceGrupo].push(aluno.id);
      contadorAluno++;
    }
  }

  /** Cria as 10 Matérias de uma Turma (núcleo + técnicas), com vínculo, notas e aulas —
   * `fechado` decide se o semestre já encerrou (afeta cutoff de frequência, quantas provas
   * têm nota lançada, e se a Matéria termina ENCERRADA). */
  async function popularTurma(
    indiceGrupo: number,
    turmaId: string,
    semestre: { dataFim: Date },
    fechado: boolean,
  ) {
    const grupo = GRUPOS[indiceGrupo];
    const alunoIds = alunosPorGrupo[indiceGrupo];
    const disciplinas = [...DISCIPLINAS_NUCLEO, ...grupo.tecnicas];
    const slots = slotsDaTurma(grupo.turno);
    const cutoff = fechado ? semestre.dataFim : hoje;

    for (let i = 0; i < disciplinas.length; i++) {
      const disciplina = disciplinas[i];
      const professor = professorDaDisciplina(disciplina, indiceGrupo);
      const horarios = [slots[2 * i], slots[2 * i + 1]];

      const materia = await prisma.materia.create({
        data: {
          nome: disciplina,
          turmaId,
          professorId: professor.id,
          cargaHorariaReferencia: 60,
          horarios: { createMany: { data: horarios } },
        },
      });

      await prisma.vinculoAlunoMateria.createMany({
        data: alunoIds.map((alunoId) => ({ alunoId, materiaId: materia.id })),
      });

      const item1 = await prisma.itemAvaliacao.create({
        data: { materiaId: materia.id, nome: 'Prova 1', valorMaximo: 10, peso: 1 },
      });
      const item2 = await prisma.itemAvaliacao.create({
        data: { materiaId: materia.id, nome: 'Prova 2', valorMaximo: 10, peso: 1 },
      });
      // Prova 1 sempre lançada; Prova 2 só no semestre fechado — no em andamento fica
      // "não lançada" de propósito, pra mostrar o estado funcionando de verdade.
      await prisma.nota.createMany({
        data: alunoIds.map((alunoId) => ({
          itemAvaliacaoId: item1.id,
          alunoId,
          valorObtido: notaComRuido(nivelPorAluno.get(alunoId)!),
        })),
      });
      if (fechado) {
        await prisma.nota.createMany({
          data: alunoIds.map((alunoId) => ({
            itemAvaliacaoId: item2.id,
            alunoId,
            valorObtido: notaComRuido(nivelPorAluno.get(alunoId)!),
          })),
        });
      }

      await gerarAulasEFrequencia(materia.id, alunoIds, cutoff);

      if (fechado) {
        await prisma.materia.update({
          where: { id: materia.id },
          data: { estado: 'ENCERRADA', encerradaEm: semestre.dataFim },
        });
      }
    }
    console.log(`  ${grupo.cursoTecnico} ${grupo.anoSerie} (${grupo.turno}) — ${fechado ? '2025/1 encerrado' : '2025/2 em andamento'}: ${disciplinas.length} matérias, ${alunoIds.length} alunos`);
  }

  console.log('Gerando 2025/1 (encerrado)...');
  for (let indiceGrupo = 0; indiceGrupo < GRUPOS.length; indiceGrupo++) {
    await popularTurma(indiceGrupo, turmas1[indiceGrupo], semestre1, true);
  }

  console.log('Gerando 2025/2 (em andamento)...');
  for (let indiceGrupo = 0; indiceGrupo < GRUPOS.length; indiceGrupo++) {
    await popularTurma(indiceGrupo, turmas2[indiceGrupo], semestre2, false);
  }

  console.log('\nCenário realista criado:');
  console.log(`  Semestres: ${NOME_SEMESTRE_1} (encerrado), ${NOME_SEMESTRE_2} (em andamento)`);
  console.log(`  Turmas: ${GRUPOS.map((g) => `${g.cursoTecnico} ${g.anoSerie} (${g.turno})`).join(', ')}`);
  console.log(`  Professores: ${contadorProfessor} (senha "${SENHA_DEMO}" pra todos)`);
  console.log(`  Alunos: ${contadorAluno} (matrícula é o login, senha "${SENHA_DEMO}" pra todos)`);
  console.log('  Rode "db-util.sh --populate-realcase-list" pra ver os logins.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
