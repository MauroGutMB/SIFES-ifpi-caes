import { BadRequestException } from '@nestjs/common';
import { FotoSolicitacoesService } from './foto-solicitacoes.service';
import { StatusSolicitacaoFoto } from '../../generated/prisma/client';

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

function solicitacaoPendente() {
  return {
    id: 'solicitacao-1',
    alunoId: 'aluno-1',
    arquivoStagingUrl: '/arquivos/arquivo-1',
    status: StatusSolicitacaoFoto.PENDENTE,
    resolvidaEm: null,
    criadaEm: new Date('2026-01-01'),
    aluno: { userId: 'user-1', nome: 'Fulano' },
  };
}

function criarServicoAprovar(opts: {
  claimCount: number;
  setFotoFalha?: boolean;
}) {
  const solicitacao = solicitacaoPendente();
  const prisma = {
    solicitacaoFoto: {
      findUnique: jest.fn().mockResolvedValue(solicitacao),
      updateMany: jest.fn().mockResolvedValue({ count: opts.claimCount }),
      update: jest.fn().mockResolvedValue({}),
      findUniqueOrThrow: jest.fn().mockResolvedValue({
        ...solicitacao,
        status: StatusSolicitacaoFoto.APROVADA,
      }),
    },
    arquivo: {
      findUniqueOrThrow: jest.fn().mockResolvedValue({
        id: 'arquivo-1',
        conteudo: Buffer.from('x'),
        mimeType: 'image/png',
      }),
      delete: jest.fn().mockResolvedValue({}),
    },
  };
  const usersService = {
    setFoto: opts.setFotoFalha
      ? jest.fn().mockRejectedValue(new Error('falha ao salvar'))
      : jest.fn().mockResolvedValue({}),
  };
  return {
    service: new FotoSolicitacoesService(
      prisma as never,
      usersService as never,
    ),
    prisma,
    usersService,
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

describe('FotoSolicitacoesService.aprovar — reivindicação atômica contra corrida', () => {
  it('aprova normalmente quando consegue reivindicar a solicitação', async () => {
    const { service, prisma, usersService } = criarServicoAprovar({
      claimCount: 1,
    });
    const resultado = await service.aprovar('solicitacao-1');
    expect(prisma.solicitacaoFoto.updateMany).toHaveBeenCalledWith({
      where: { id: 'solicitacao-1', status: StatusSolicitacaoFoto.PENDENTE },
      data: expect.objectContaining({
        status: StatusSolicitacaoFoto.APROVADA,
      }) as unknown,
    });
    expect(usersService.setFoto).toHaveBeenCalled();
    expect(prisma.arquivo.delete).toHaveBeenCalledWith({
      where: { id: 'arquivo-1' },
    });
    expect(resultado.alunoNome).toBe('Fulano');
  });

  it('rejeita com 400 sem tocar em arquivo quando outra chamada já reivindicou primeiro', async () => {
    const { service, prisma, usersService } = criarServicoAprovar({
      claimCount: 0,
    });
    await expect(service.aprovar('solicitacao-1')).rejects.toThrow(
      BadRequestException,
    );
    expect(usersService.setFoto).not.toHaveBeenCalled();
    expect(prisma.arquivo.delete).not.toHaveBeenCalled();
  });

  it('devolve a solicitação para PENDENTE se a troca de foto falhar depois de reivindicada', async () => {
    const { service, prisma } = criarServicoAprovar({
      claimCount: 1,
      setFotoFalha: true,
    });
    await expect(service.aprovar('solicitacao-1')).rejects.toThrow(
      'falha ao salvar',
    );
    expect(prisma.solicitacaoFoto.update).toHaveBeenCalledWith({
      where: { id: 'solicitacao-1' },
      data: { status: StatusSolicitacaoFoto.PENDENTE, resolvidaEm: null },
    });
  });
});
