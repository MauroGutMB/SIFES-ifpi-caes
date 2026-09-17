/**
 * Lista os logins criados pelo populate-realcase, pra facilitar testar manualmente
 * (professor/aluno de demonstração). Senha fixa "demo1234" pra todos (ver seed-realcase.ts).
 */
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { login: { startsWith: 'DEMO-' } },
        { login: { endsWith: '@demo.sifes.ifpi.edu.br' } },
      ],
    },
    include: {
      professor: { select: { nome: true } },
      aluno: { select: { nome: true, turmaId: true } },
    },
    orderBy: [{ role: 'asc' }, { login: 'asc' }],
  });

  if (users.length === 0) {
    console.log(
      'Nenhum usuário do cenário de demonstração encontrado — rode "./db-util.sh --populate-realcase" primeiro.',
    );
    return;
  }

  console.log('Logins do cenário de demonstração (senha "demo1234" para todos):\n');
  console.log('ROLE       LOGIN                                NOME                  SEM TURMA');
  for (const u of users) {
    const nome = u.professor?.nome ?? u.aluno?.nome ?? '';
    const semTurma = u.role === 'ALUNO' && !u.aluno?.turmaId ? '(sem turma)' : '';
    console.log(
      `${u.role.padEnd(10)} ${u.login.padEnd(36)} ${nome.padEnd(21)} ${semTurma}`,
    );
  }
  console.log(`\nTotal: ${users.length} usuário(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
