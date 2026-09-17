import { NotFoundException } from '@nestjs/common';
import { Role } from '../../generated/prisma/client';
import { AuthenticatedUser } from '../auth/auth.types';

/**
 * Retorna 404 (não 403) quando um professor tenta acessar um recurso de outro professor,
 * pra não vazar a existência de recursos que ele não possui.
 */
export function garantirPosseProfessor(
  user: AuthenticatedUser,
  professorIdDoRecurso: string,
  mensagemNaoEncontrado: string,
): void {
  if (
    user.role === Role.PROFESSOR &&
    professorIdDoRecurso !== user.professorId
  ) {
    throw new NotFoundException(mensagemNaoEncontrado);
  }
}
