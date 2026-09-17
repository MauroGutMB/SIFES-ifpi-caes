/**
 * Popula o banco com um cenário acadêmico realista pra testes manuais/demo:
 * 1 semestre "atual", 2 turmas, 3 professores, 12 alunos, 4 matérias com aulas
 * geradas, notas e frequência lançadas, e 1 matéria já encerrada (pra mostrar
 * situação/pendência funcionando). Não roda de novo se já existir — rode
 * `db-util.sh --reset-db` antes se quiser popular de novo do zero.
 */
import { PrismaClient, DiaSemana, StatusFrequencia } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import { gerarOcorrenciasAula } from '../src/materias/horario.util';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const NOME_SEMESTRE = '2026/Demo';

function addDias(data: Date, dias: number): Date {
  const resultado = new Date(data);
  resultado.setUTCDate(resultado.getUTCDate() + dias);
  return resultado;
}

function aleatorioEntre(min: number, max: number): number {
  return Math.round((min + Math.random() * (max - min)) * 100) / 100;
}

function statusAleatorio(): StatusFrequencia {
  const r = Math.random();
  if (r < 0.85) return StatusFrequencia.PRESENTE;
  if (r < 0.95) return StatusFrequencia.FALTA;
  return StatusFrequencia.FALTA_JUSTIFICADA;
}

async function criarUsuario(login: string, role: 'PROFESSOR' | 'ALUNO') {
  const senhaHash = await bcrypt.hash('demo1234', 10);
  return prisma.user.create({ data: { login, senhaHash, role, precisaTrocarSenha: false } });
}

async function gerarAulasEFrequencia(materiaId: string, alunoIds: string[], hoje: Date) {
  const materia = await prisma.materia.findUniqueOrThrow({
    where: { id: materiaId },
    include: { turma: { include: { semestre: true } } },
  });
  const ocorrencias = gerarOcorrenciasAula(
    materia.turma.semestre.dataInicio,
    materia.turma.semestre.dataFim,
    materia.diaSemana,
    materia.horaInicio,
  );

  for (const ocorrencia of ocorrencias) {
    const aula = await prisma.aula.create({
      data: {
        materiaId,
        data: ocorrencia.data,
        horaInicio: ocorrencia.horaInicio,
        horaFim: ocorrencia.horaFim,
        titulo: ocorrencia.data <= hoje ? 'Aula lançada (demo)' : null,
        descricao: ocorrencia.data <= hoje ? 'Conteúdo gerado pelo populate-realcase.' : null,
      },
    });
    if (ocorrencia.data <= hoje) {
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

async function main() {
  const existente = await prisma.semestre.findUnique({ where: { nome: NOME_SEMESTRE } });
  if (existente) {
    console.log(
      `Já existe um semestre "${NOME_SEMESTRE}" — rode "db-util.sh --reset-db" antes de popular de novo.`,
    );
    return;
  }

  const hoje = new Date();
  hoje.setUTCHours(0, 0, 0, 0);

  const semestre = await prisma.semestre.create({
    data: { nome: NOME_SEMESTRE, dataInicio: addDias(hoje, -60), dataFim: addDias(hoje, 120) },
  });

  const turmaInfo = await prisma.turma.create({
    data: {
      semestreId: semestre.id,
      cursoTecnico: 'Informática',
      anoSerie: '1º ano',
      turno: 'MANHA',
    },
  });
  const turmaAgro = await prisma.turma.create({
    data: {
      semestreId: semestre.id,
      cursoTecnico: 'Agropecuária',
      anoSerie: '2º ano',
      turno: 'TARDE',
    },
  });

  const professoresInfo = [
    { nome: 'Ana Souza', email: 'ana.souza@demo.sifes.ifpi.edu.br' },
    { nome: 'Carlos Lima', email: 'carlos.lima@demo.sifes.ifpi.edu.br' },
    { nome: 'Beatriz Rocha', email: 'beatriz.rocha@demo.sifes.ifpi.edu.br' },
  ];
  const professores: Record<string, string> = {};
  for (const p of professoresInfo) {
    const user = await criarUsuario(p.email, 'PROFESSOR');
    const professor = await prisma.professor.create({
      data: { userId: user.id, nome: p.nome, email: p.email },
    });
    professores[p.nome] = professor.id;
  }

  const materiasInfo = [
    { turmaId: turmaInfo.id, nome: 'Matemática', professor: 'Ana Souza', dia: DiaSemana.SEGUNDA, hora: '08:00' },
    { turmaId: turmaInfo.id, nome: 'Português', professor: 'Carlos Lima', dia: DiaSemana.QUARTA, hora: '08:00' },
    { turmaId: turmaAgro.id, nome: 'Zootecnia', professor: 'Beatriz Rocha', dia: DiaSemana.TERCA, hora: '13:00' },
    { turmaId: turmaAgro.id, nome: 'Solos', professor: 'Ana Souza', dia: DiaSemana.QUINTA, hora: '13:00' },
  ];
  const materiaIds: { id: string; turmaId: string; nome: string }[] = [];
  for (const m of materiasInfo) {
    const materia = await prisma.materia.create({
      data: {
        turmaId: m.turmaId,
        professorId: professores[m.professor],
        cargaHorariaReferencia: 60,
        diaSemana: m.dia,
        horaInicio: m.hora,
      },
    });
    materiaIds.push({ id: materia.id, turmaId: m.turmaId, nome: m.nome });
  }

  const alunosPorTurma: Record<string, string[]> = { [turmaInfo.id]: [], [turmaAgro.id]: [] };
  for (let i = 1; i <= 12; i++) {
    const matricula = `DEMO-${String(i).padStart(3, '0')}`;
    const turmaId = i <= 6 ? turmaInfo.id : turmaAgro.id;
    const user = await criarUsuario(matricula, 'ALUNO');
    const aluno = await prisma.aluno.create({
      data: { userId: user.id, nome: `Aluno Demo ${i}`, matricula, turmaId },
    });
    alunosPorTurma[turmaId].push(aluno.id);
  }

  for (const materia of materiaIds) {
    const alunoIds = alunosPorTurma[materia.turmaId];
    await prisma.vinculoAlunoMateria.createMany({
      data: alunoIds.map((alunoId) => ({ alunoId, materiaId: materia.id })),
    });

    const item1 = await prisma.itemAvaliacao.create({
      data: { materiaId: materia.id, nome: 'Prova 1', valorMaximo: 10 },
    });
    const item2 = await prisma.itemAvaliacao.create({
      data: { materiaId: materia.id, nome: 'Prova 2', valorMaximo: 10 },
    });
    for (const alunoId of alunoIds) {
      await prisma.nota.create({
        data: { itemAvaliacaoId: item1.id, alunoId, valorObtido: aleatorioEntre(4, 10) },
      });
      await prisma.nota.create({
        data: { itemAvaliacaoId: item2.id, alunoId, valorObtido: aleatorioEntre(4, 10) },
      });
    }

    await gerarAulasEFrequencia(materia.id, alunoIds, hoje);
  }

  // Encerra "Português" pra demonstrar situação/pendência funcionando de verdade.
  const portugues = materiaIds.find((m) => m.nome === 'Português')!;
  await prisma.materia.update({
    where: { id: portugues.id },
    data: { estado: 'ENCERRADA', encerradaEm: new Date() },
  });

  console.log('Cenário realista criado:');
  console.log(`  Semestre: ${NOME_SEMESTRE} (${semestre.id})`);
  console.log(`  Turmas: Informática 1º ano (${turmaInfo.id}), Agropecuária 2º ano (${turmaAgro.id})`);
  console.log(`  Professores: ${professoresInfo.map((p) => p.email).join(', ')}`);
  console.log('  Alunos: DEMO-001 .. DEMO-012 (senha "demo1234" pra todos)');
  console.log('  Matérias: Matemática, Português (encerrada), Zootecnia, Solos');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
