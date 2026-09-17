import { NotFoundException } from '@nestjs/common';
import { Role } from '../../generated/prisma/client';
import { AuthenticatedUser } from '../auth/auth.types';
import { PrismaService } from '../prisma/prisma.service';

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

/**
 * Checagem de leitura para endpoints que Aluno também pode consultar (aulas, materiais,
 * atividades de uma Matéria em que ele está vinculado) — além da checagem normal de posse do
 * professor. Sempre 404 quando o acesso não é permitido, pelo mesmo motivo de garantirPosseProfessor.
 */
export async function garantirAcessoLeituraMateria(
  prisma: PrismaService,
  user: AuthenticatedUser,
  materia: { id: string; professorId: string },
  mensagemNaoEncontrado: string,
): Promise<void> {
  if (user.role === Role.PROFESSOR) {
    garantirPosseProfessor(user, materia.professorId, mensagemNaoEncontrado);
    return;
  }
  if (user.role === Role.ALUNO) {
    const vinculo = await prisma.vinculoAlunoMateria.findUnique({
      where: {
        alunoId_materiaId: { alunoId: user.alunoId!, materiaId: materia.id },
      },
    });
    if (!vinculo) {
      throw new NotFoundException(mensagemNaoEncontrado);
    }
  }
}
