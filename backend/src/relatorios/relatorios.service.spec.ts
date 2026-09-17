import { NotFoundException } from '@nestjs/common';
import { RelatoriosService } from './relatorios.service';
import { AuthenticatedUser } from '../auth/auth.types';
import { Role } from '../../generated/prisma/client';

function usuario(parcial: Partial<AuthenticatedUser>): AuthenticatedUser {
  return { id: 'user-1', role: Role.ADMIN, ...parcial };
}

const MATERIAS_DA_TURMA = [
  { id: 'materia-prof1', professorId: 'prof-1', nome: 'Matemática' },
  { id: 'materia-prof2', professorId: 'prof-2', nome: 'Português' },
];

function criarServico(vinculosDoAluno: { materiaId: string }[] = []) {
  const prisma = {
    turma: {
      findUnique: jest
        .fn()
        .mockResolvedValue({ id: 'turma-1', materias: MATERIAS_DA_TURMA }),
    },
    aula: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    vinculoAlunoMateria: {
      findMany: jest
        .fn()
        // 1ª chamada (só quando ALUNO): filtra as matérias em que ele está vinculado.
        .mockResolvedValueOnce(vinculosDoAluno)
        // 2ª chamada: monta o resumo — sem alunos vinculados nesse teste, resumo fica vazio.
        .mockResolvedValue([]),
    },
  };
  const boletim = {};
  return {
    service: new RelatoriosService(prisma as never, boletim as never),
    prisma,
  };
}

describe('RelatoriosService.frequenciaTurmaDetalhada — cada papel só vê o que pode', () => {
  it('404 quando a turma não existe', async () => {
    const prisma = {
      turma: { findUnique: jest.fn().mockResolvedValue(null) },
      aula: { findMany: jest.fn() },
      vinculoAlunoMateria: { findMany: jest.fn() },
    };
    const service = new RelatoriosService(prisma as never, {} as never);
    await expect(
      service.frequenciaTurmaDetalhada(
        'inexistente',
        usuario({ role: Role.ADMIN }),
        {},
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('admin vê todas as matérias da turma, de qualquer professor', async () => {
    const { service } = criarServico();
    const resultado = await service.frequenciaTurmaDetalhada(
      'turma-1',
      usuario({ role: Role.ADMIN }),
      {},
    );
    expect(resultado.materias.map((m) => m.id).sort()).toEqual(
      ['materia-prof1', 'materia-prof2'].sort(),
    );
  });

  it('professor só vê as próprias matérias dentro da turma', async () => {
    const { service } = criarServico();
    const resultado = await service.frequenciaTurmaDetalhada(
      'turma-1',
      usuario({ role: Role.PROFESSOR, professorId: 'prof-1' }),
      {},
    );
    expect(resultado.materias).toEqual([
      { id: 'materia-prof1', nome: 'Matemática' },
    ]);
  });

  it('404 quando o professor não leciona nenhuma matéria dessa turma', async () => {
    const { service } = criarServico();
    await expect(
      service.frequenciaTurmaDetalhada(
        'turma-1',
        usuario({ role: Role.PROFESSOR, professorId: 'prof-sem-materia-aqui' }),
        {},
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('aluno só vê as matérias em que está vinculado, mesmo pedindo todas', async () => {
    const { service } = criarServico([{ materiaId: 'materia-prof1' }]);
    const resultado = await service.frequenciaTurmaDetalhada(
      'turma-1',
      usuario({ role: Role.ALUNO, alunoId: 'aluno-1' }),
      {},
    );
    expect(resultado.materias).toEqual([
      { id: 'materia-prof1', nome: 'Matemática' },
    ]);
  });

  it('aluno nunca consegue ver a frequência de outro aluno via o filtro alunoId', async () => {
    const { service, prisma } = criarServico([{ materiaId: 'materia-prof1' }]);
    await service.frequenciaTurmaDetalhada(
      'turma-1',
      usuario({ role: Role.ALUNO, alunoId: 'aluno-1' }),
      { alunoId: 'aluno-de-outra-pessoa' },
    );
    // O alunoId usado no filtro do resumo tem que ser sempre o do usuário logado,
    // nunca o que veio na query string.
    expect(prisma.vinculoAlunoMateria.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ alunoId: 'aluno-1' }) as unknown,
      }),
    );
  });

  it('404 quando o aluno não está vinculado a nenhuma matéria dessa turma', async () => {
    const { service } = criarServico([]);
    await expect(
      service.frequenciaTurmaDetalhada(
        'turma-1',
        usuario({ role: Role.ALUNO, alunoId: 'aluno-sem-vinculo' }),
        {},
      ),
    ).rejects.toThrow(NotFoundException);
  });
});
