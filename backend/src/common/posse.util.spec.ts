import { NotFoundException } from '@nestjs/common';
import {
  garantirAcessoLeituraMateria,
  garantirPosseProfessor,
} from './posse.util';
import { AuthenticatedUser } from '../auth/auth.types';
import { Role } from '../../generated/prisma/client';

function usuario(parcial: Partial<AuthenticatedUser>): AuthenticatedUser {
  return { id: 'user-1', role: Role.ADMIN, ...parcial };
}

describe('garantirPosseProfessor', () => {
  it('nunca bloqueia admin, mesmo com professorId diferente de qualquer coisa', () => {
    const admin = usuario({ role: Role.ADMIN });
    expect(() =>
      garantirPosseProfessor(admin, 'professor-de-outro', 'não encontrado'),
    ).not.toThrow();
  });

  it('libera o professor dono do recurso', () => {
    const professor = usuario({ role: Role.PROFESSOR, professorId: 'prof-1' });
    expect(() =>
      garantirPosseProfessor(professor, 'prof-1', 'não encontrado'),
    ).not.toThrow();
  });

  it('bloqueia com 404 (não 403) o professor tentando acessar recurso de outro professor', () => {
    const professor = usuario({ role: Role.PROFESSOR, professorId: 'prof-1' });
    expect(() =>
      garantirPosseProfessor(professor, 'prof-2', 'Aula não encontrada'),
    ).toThrow(NotFoundException);
    try {
      garantirPosseProfessor(professor, 'prof-2', 'Aula não encontrada');
    } catch (erro) {
      expect((erro as NotFoundException).message).toBe('Aula não encontrada');
    }
  });
});

describe('garantirAcessoLeituraMateria', () => {
  const materia = { id: 'materia-1', professorId: 'prof-1' };

  function prismaFalso(vinculoEncontrado: unknown) {
    return {
      vinculoAlunoMateria: {
        findUnique: jest.fn().mockResolvedValue(vinculoEncontrado),
      },
    };
  }

  it('admin sempre passa, sem nem consultar o vínculo', async () => {
    const prisma = prismaFalso(null);
    const admin = usuario({ role: Role.ADMIN });
    await expect(
      garantirAcessoLeituraMateria(prisma as never, admin, materia, 'x'),
    ).resolves.toBeUndefined();
    expect(prisma.vinculoAlunoMateria.findUnique).not.toHaveBeenCalled();
  });

  it('professor dono da matéria passa, sem consultar vínculo de aluno', async () => {
    const prisma = prismaFalso(null);
    const professor = usuario({ role: Role.PROFESSOR, professorId: 'prof-1' });
    await expect(
      garantirAcessoLeituraMateria(prisma as never, professor, materia, 'x'),
    ).resolves.toBeUndefined();
    expect(prisma.vinculoAlunoMateria.findUnique).not.toHaveBeenCalled();
  });

  it('professor de outra matéria é bloqueado com 404', async () => {
    const prisma = prismaFalso(null);
    const outroProfessor = usuario({
      role: Role.PROFESSOR,
      professorId: 'prof-2',
    });
    await expect(
      garantirAcessoLeituraMateria(
        prisma as never,
        outroProfessor,
        materia,
        'x',
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('aluno vinculado à matéria passa', async () => {
    const prisma = prismaFalso({ id: 'vinculo-1' });
    const aluno = usuario({ role: Role.ALUNO, alunoId: 'aluno-1' });
    await expect(
      garantirAcessoLeituraMateria(prisma as never, aluno, materia, 'x'),
    ).resolves.toBeUndefined();
    expect(prisma.vinculoAlunoMateria.findUnique).toHaveBeenCalledWith({
      where: {
        alunoId_materiaId: { alunoId: 'aluno-1', materiaId: 'materia-1' },
      },
    });
  });

  it('aluno não vinculado à matéria é bloqueado com 404 — nunca vê que a matéria existe', async () => {
    const prisma = prismaFalso(null);
    const aluno = usuario({ role: Role.ALUNO, alunoId: 'aluno-2' });
    await expect(
      garantirAcessoLeituraMateria(
        prisma as never,
        aluno,
        materia,
        'Matéria não encontrada',
      ),
    ).rejects.toThrow(NotFoundException);
  });
});
