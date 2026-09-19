import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AulasService } from './aulas.service';
import { AuthenticatedUser } from '../auth/auth.types';
import { EstadoMateria, Role } from '../../generated/prisma/client';

const DATA_PASSADA = new Date('2000-01-01T00:00:00.000Z');
const DATA_FUTURA = new Date('2999-01-01T00:00:00.000Z');

function usuario(parcial: Partial<AuthenticatedUser>): AuthenticatedUser {
  return { id: 'user-1', role: Role.PROFESSOR, ...parcial };
}

function criarServico(aulaEncontrada: unknown) {
  const prisma = {
    aula: {
      findUnique: jest.fn().mockResolvedValue(aulaEncontrada),
      update: jest.fn().mockResolvedValue({ id: 'aula-1' }),
    },
    vinculoAlunoMateria: {
      count: jest.fn().mockResolvedValue(1),
    },
    frequencia: {
      findMany: jest.fn().mockResolvedValue([]),
      upsert: jest.fn().mockResolvedValue({}),
    },
    $transaction: jest.fn().mockResolvedValue([]),
  };
  return { service: new AulasService(prisma as never), prisma };
}

describe('AulasService — checagem de posse e de data', () => {
  const aulaDoProfessor1 = (
    data: Date,
    estadoMateria: EstadoMateria = EstadoMateria.ABERTA,
  ) => ({
    id: 'aula-1',
    materiaId: 'materia-1',
    data,
    materia: { professorId: 'prof-1', estado: estadoMateria },
  });

  describe('update', () => {
    it('bloqueia com 404 quando a aula é de outro professor', async () => {
      const { service } = criarServico(aulaDoProfessor1(DATA_PASSADA));
      const outroProfessor = usuario({
        role: Role.PROFESSOR,
        professorId: 'prof-2',
      });
      await expect(
        service.update('aula-1', { titulo: 'x' }, outroProfessor),
      ).rejects.toThrow(NotFoundException);
    });

    it('bloqueia com 400 uma edição em aula de data futura, mesmo sendo o dono', async () => {
      const { service } = criarServico(aulaDoProfessor1(DATA_FUTURA));
      const dono = usuario({ role: Role.PROFESSOR, professorId: 'prof-1' });
      await expect(
        service.update('aula-1', { titulo: 'x' }, dono),
      ).rejects.toThrow(BadRequestException);
    });

    it('permite editar aula passada do próprio professor', async () => {
      const { service, prisma } = criarServico(aulaDoProfessor1(DATA_PASSADA));
      const dono = usuario({ role: Role.PROFESSOR, professorId: 'prof-1' });
      await service.update('aula-1', { titulo: 'Aula sobre frações' }, dono);
      expect(prisma.aula.update).toHaveBeenCalledWith({
        where: { id: 'aula-1' },
        data: { titulo: 'Aula sobre frações', descricao: undefined },
      });
    });

    it('admin edita aula de qualquer professor', async () => {
      const { service, prisma } = criarServico(aulaDoProfessor1(DATA_PASSADA));
      const admin = usuario({ role: Role.ADMIN });
      await service.update('aula-1', { titulo: 'x' }, admin);
      expect(prisma.aula.update).toHaveBeenCalled();
    });
  });

  describe('setFrequencias', () => {
    it('bloqueia com 400 o lançamento de frequência numa aula de data futura', async () => {
      const { service } = criarServico(aulaDoProfessor1(DATA_FUTURA));
      const dono = usuario({ role: Role.PROFESSOR, professorId: 'prof-1' });
      await expect(
        service.setFrequencias(
          'aula-1',
          { frequencias: [{ alunoId: 'aluno-1', status: 'PRESENTE' }] },
          dono,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('bloqueia com 404 o professor tentando lançar frequência de aula alheia', async () => {
      const { service } = criarServico(aulaDoProfessor1(DATA_PASSADA));
      const outroProfessor = usuario({
        role: Role.PROFESSOR,
        professorId: 'prof-2',
      });
      await expect(
        service.setFrequencias(
          'aula-1',
          { frequencias: [{ alunoId: 'aluno-1', status: 'PRESENTE' }] },
          outroProfessor,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('permite lançar frequência de aula passada do próprio professor', async () => {
      const { service, prisma } = criarServico(aulaDoProfessor1(DATA_PASSADA));
      const dono = usuario({ role: Role.PROFESSOR, professorId: 'prof-1' });
      await service.setFrequencias(
        'aula-1',
        { frequencias: [{ alunoId: 'aluno-1', status: 'PRESENTE' }] },
        dono,
      );
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('bloqueia com 400 o lançamento de frequência numa Disciplina já encerrada', async () => {
      const { service, prisma } = criarServico(
        aulaDoProfessor1(DATA_PASSADA, EstadoMateria.ENCERRADA),
      );
      const dono = usuario({ role: Role.PROFESSOR, professorId: 'prof-1' });
      await expect(
        service.setFrequencias(
          'aula-1',
          { frequencias: [{ alunoId: 'aluno-1', status: 'PRESENTE' }] },
          dono,
        ),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('override (admin)', () => {
    it('404 quando a aula não existe', async () => {
      const { service } = criarServico(null);
      await expect(
        service.override('inexistente', { estado: 'LANCADO' }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
