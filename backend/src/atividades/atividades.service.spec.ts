import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AtividadesService } from './atividades.service';
import { AuthenticatedUser } from '../auth/auth.types';
import { Role } from '../../generated/prisma/client';

const PRAZO_PASSADO = new Date('2000-01-01T00:00:00.000Z');
const PRAZO_FUTURO = new Date('2999-01-01T00:00:00.000Z');

function usuario(parcial: Partial<AuthenticatedUser>): AuthenticatedUser {
  return { id: 'user-1', role: Role.ALUNO, ...parcial };
}

// Os bytes iniciais precisam bater com a assinatura real do mimetype declarado — o serviço agora
// valida magic bytes, não só o header, então um buffer de texto solto seria rejeitado mesmo nos
// casos de sucesso.
const MAGIC_POR_MIME: Record<string, number[]> = {
  'application/pdf': [0x25, 0x50, 0x44, 0x46],
  'image/png': [0x89, 0x50, 0x4e, 0x47],
  'image/jpeg': [0xff, 0xd8, 0xff],
};

function arquivoFalso(mimetype: string) {
  return {
    originalname: 'arquivo.pdf',
    mimetype,
    buffer: Buffer.from(MAGIC_POR_MIME[mimetype] ?? []),
  } as Express.Multer.File;
}

function criarServico(atividadeEncontrada: unknown) {
  const prisma = {
    atividade: {
      findUnique: jest.fn().mockResolvedValue(atividadeEncontrada),
    },
    vinculoAlunoMateria: {
      findUnique: jest.fn().mockResolvedValue({ id: 'vinculo-1' }),
    },
    entrega: {
      findUnique: jest.fn().mockResolvedValue(null),
      upsert: jest.fn().mockResolvedValue({ id: 'entrega-1' }),
    },
    arquivo: {
      create: jest.fn().mockResolvedValue({ id: 'arquivo-1' }),
      delete: jest.fn().mockResolvedValue({}),
    },
  };
  return { service: new AtividadesService(prisma as never), prisma };
}

describe('AtividadesService.entregar — prazo e permissão', () => {
  const atividadeAberta = (prazo: Date | null) => ({
    id: 'atividade-1',
    materiaId: 'materia-1',
    formatoExigido: 'PDF',
    prazo,
    materia: { estado: 'ABERTA' },
  });

  it('404 quando a atividade não existe', async () => {
    const { service } = criarServico(null);
    await expect(
      service.entregar(
        'inexistente',
        arquivoFalso('application/pdf'),
        usuario({ alunoId: 'aluno-1' }),
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('400 quando a matéria da atividade já foi encerrada', async () => {
    const { service } = criarServico({
      ...atividadeAberta(null),
      materia: { estado: 'ENCERRADA' },
    });
    await expect(
      service.entregar(
        'atividade-1',
        arquivoFalso('application/pdf'),
        usuario({ alunoId: 'aluno-1' }),
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('400 quando o prazo de entrega já passou — não deixa fazer upload', async () => {
    const { service, prisma } = criarServico(atividadeAberta(PRAZO_PASSADO));
    await expect(
      service.entregar(
        'atividade-1',
        arquivoFalso('application/pdf'),
        usuario({ alunoId: 'aluno-1' }),
      ),
    ).rejects.toThrow(BadRequestException);
    expect(prisma.entrega.upsert).not.toHaveBeenCalled();
  });

  it('400 quando o aluno não está vinculado à matéria da atividade', async () => {
    const { service, prisma } = criarServico(atividadeAberta(PRAZO_FUTURO));
    prisma.vinculoAlunoMateria.findUnique.mockResolvedValue(null);
    await expect(
      service.entregar(
        'atividade-1',
        arquivoFalso('application/pdf'),
        usuario({ alunoId: 'aluno-2' }),
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('400 quando o arquivo enviado não bate com o formato exigido', async () => {
    const { service } = criarServico(atividadeAberta(PRAZO_FUTURO));
    await expect(
      service.entregar(
        'atividade-1',
        arquivoFalso('image/png'),
        usuario({ alunoId: 'aluno-1' }),
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('sem prazo definido (atividade legada), aceita a entrega normalmente', async () => {
    const { service, prisma } = criarServico(atividadeAberta(null));
    await service.entregar(
      'atividade-1',
      arquivoFalso('application/pdf'),
      usuario({ alunoId: 'aluno-1' }),
    );
    expect(prisma.entrega.upsert).toHaveBeenCalled();
  });

  it('dentro do prazo e vinculado, aceita a entrega', async () => {
    const { service, prisma } = criarServico(atividadeAberta(PRAZO_FUTURO));
    await service.entregar(
      'atividade-1',
      arquivoFalso('application/pdf'),
      usuario({ alunoId: 'aluno-1' }),
    );
    expect(prisma.entrega.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          atividadeId_alunoId: {
            atividadeId: 'atividade-1',
            alunoId: 'aluno-1',
          },
        },
      }),
    );
  });
});
