import { FotoSolicitacoesService } from './foto-solicitacoes.service';

function arquivoFalso() {
  return {
    mimetype: 'image/png',
    buffer: Buffer.from('x'),
  } as Express.Multer.File;
}

function criarServico(pendenteExistente: unknown) {
  const prisma = {
    solicitacaoFoto: {
      findFirst: jest.fn().mockResolvedValue(pendenteExistente),
      create: jest.fn().mockResolvedValue({ id: 'nova' }),
      update: jest.fn().mockResolvedValue({ id: 'atualizada' }),
    },
    arquivo: {
      create: jest.fn().mockResolvedValue({ id: 'arquivo-novo' }),
      delete: jest.fn().mockResolvedValue({}),
    },
  };
  const usersService = {};
  return {
    service: new FotoSolicitacoesService(
      prisma as never,
      usersService as never,
    ),
    prisma,
  };
}

describe('FotoSolicitacoesService.criar — um aluno, uma solicitação pendente por vez', () => {
  it('sem solicitação pendente, cria uma nova', async () => {
    const { service, prisma } = criarServico(null);
    await service.criar('aluno-1', arquivoFalso());
    expect(prisma.solicitacaoFoto.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ alunoId: 'aluno-1' }) as unknown,
      }),
    );
    expect(prisma.solicitacaoFoto.update).not.toHaveBeenCalled();
  });

  it('com uma solicitação pendente, substitui a foto dela em vez de criar outra', async () => {
    const pendente = { id: 'pendente-1', arquivoStagingUrl: 'antiga.png' };
    const { service, prisma } = criarServico(pendente);
    await service.criar('aluno-1', arquivoFalso());
    expect(prisma.solicitacaoFoto.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'pendente-1' } }),
    );
    expect(prisma.solicitacaoFoto.create).not.toHaveBeenCalled();
  });
});
