import { ConflictException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';

/** Converte violação de unicidade do Prisma (P2002) em 409 amigável. */
export function rethrowAsConflict(error: unknown, mensagem: string): never {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  ) {
    throw new ConflictException(mensagem);
  }
  throw error;
}
