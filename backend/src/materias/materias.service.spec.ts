import { BadRequestException } from '@nestjs/common';
import { MateriasService } from './materias.service';
import { AuthenticatedUser } from '../auth/auth.types';
import { EstadoMateria, Role } from '../../generated/prisma/client';

function usuarioProfessor(): AuthenticatedUser {
  return { id: 'user-1', role: Role.PROFESSOR, professorId: 'prof-1' };
}

/** dataFim é meia-noite do último dia do Semestre, no mesmo esquema "Brasília fake"
 * usado pelo resto do app (ver tempo.util.ts). */
function materiaAberta(dataFim: Date) {
  return {
    id: 'materia-1',
    estado: EstadoMateria.ABERTA,
    professorId: 'prof-1',
    turma: { semestre: { dataFim } },
  };
}

function criarServico(materiaEncontrada: unknown) {
  const prisma = {
    materia: {
      findUnique: jest.fn().mockResolvedValue(materiaEncontrada),
      update: jest.fn().mockResolvedValue({ id: 'materia-1' }),
    },
    vinculoAlunoMateria: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  };
  const boletim = {};
  return {
    service: new MateriasService(prisma as never, boletim as never),
    prisma,
  };
}

describe('MateriasService.encerrar — limite de data do fim do Semestre (off-by-one)', () => {
  it('professor NÃO consegue encerrar no próprio dia do fim do Semestre, mesmo de madrugada', async () => {
    // dataFim = hoje à meia-noite (esquema Brasília fake) — "agora" real é sempre depois
    // da meia-noite do mesmo dia, então um bug de comparação por instante deixaria passar aqui.
    const hoje = new Date();
    const dataFimHoje = new Date(
      Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), hoje.getUTCDate()),
    );
    const { service } = criarServico(materiaAberta(dataFimHoje));
    await expect(
      service.encerrar('materia-1', usuarioProfessor()),
    ).rejects.toThrow(BadRequestException);
  });

  it('professor consegue encerrar no dia seguinte ao fim do Semestre', async () => {
    const ontem = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const dataFimOntem = new Date(
      Date.UTC(ontem.getUTCFullYear(), ontem.getUTCMonth(), ontem.getUTCDate()),
    );
    const { service, prisma } = criarServico(materiaAberta(dataFimOntem));
    await service.encerrar('materia-1', usuarioProfessor());
    expect(prisma.materia.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'materia-1' } }),
    );
  });

  it('professor não consegue encerrar antes do fim do Semestre', async () => {
    const amanha = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const dataFimFutura = new Date(
      Date.UTC(
        amanha.getUTCFullYear(),
        amanha.getUTCMonth(),
        amanha.getUTCDate(),
      ),
    );
    const { service } = criarServico(materiaAberta(dataFimFutura));
    await expect(
      service.encerrar('materia-1', usuarioProfessor()),
    ).rejects.toThrow(BadRequestException);
  });
});
