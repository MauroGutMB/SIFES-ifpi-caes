import { BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';

function criarServico() {
  const prisma = {};
  const alunosService = {};
  const professoresService = {};
  return new UsersService(
    prisma as never,
    alunosService as never,
    professoresService as never,
  );
}

describe('UsersService.importarUsuarios — encoding do CSV', () => {
  it('rejeita com 400 um CSV que não é UTF-8 válido (ex: exportado como Windows-1252)', async () => {
    const service = criarServico();
    // 0xE9 sozinho não é uma sequência UTF-8 válida (é "é" em Latin-1/Windows-1252) —
    // decodificar isso como UTF-8 sem validação produziria um nome corrompido em silêncio.
    const csvWindows1252 = Buffer.from([
      ...Buffer.from('nome,login,cargo\nJos'),
      0xe9,
      ...Buffer.from(',jose,ALUNO\n'),
    ]);
    await expect(service.importarUsuarios(csvWindows1252)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('aceita normalmente um CSV em UTF-8 válido com acentos', async () => {
    const prisma = { user: { findUnique: jest.fn().mockResolvedValue(null) } };
    const alunosService = {
      create: jest
        .fn()
        .mockResolvedValue({ senhaInicial: 'abc123' }),
    };
    const service = new UsersService(
      prisma as never,
      alunosService as never,
      {} as never,
    );
    const csvUtf8 = Buffer.from(
      'nome,login,cargo\nJosé,jose,ALUNO\n',
      'utf-8',
    );
    const resultado = await service.importarUsuarios(csvUtf8);
    expect(resultado.importados).toHaveLength(1);
    expect(resultado.importados[0].nome).toBe('José');
  });
});
