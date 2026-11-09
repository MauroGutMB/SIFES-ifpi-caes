import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const login = process.env.ADMIN_LOGIN ?? 'admin';
  const senha = process.env.ADMIN_SENHA ?? 'admin123';

  if (process.env.NODE_ENV === 'production' && !process.env.ADMIN_SENHA) {
    throw new Error('Em produção, defina ADMIN_SENHA — o padrão não é aceito.');
  }

  const existente = await prisma.user.findUnique({ where: { login } });
  if (existente) {
    console.log(`Admin "${login}" já existe, nada a fazer.`);
    return;
  }

  await prisma.user.create({
    data: {
      login,
      senhaHash: await bcrypt.hash(senha, 10),
      role: 'ADMIN',
      precisaTrocarSenha: true,
    },
  });

  console.log(`Admin "${login}" criado com senha inicial "${senha}".`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
