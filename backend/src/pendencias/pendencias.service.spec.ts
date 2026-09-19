import { PendenciasService } from './pendencias.service';
import { EstadoMateria } from '../../generated/prisma/client';

const MATERIA_ENCERRADA = {
  id: 'materia-1',
  nome: 'Matemática',
  estado: EstadoMateria.ENCERRADA,
  turma: { semestre: { nome: '2026/1' } },
};

function boletimComReprovado(
  alunoId: string,
  alunoNome: string,
  matricula: string,
) {
  return [
    {
      aluno: { id: alunoId, nome: alunoNome, matricula },
      situacao: 'REPROVADO',
      notaFinal: 4.5,
    },
  ];
}

function criarServico(opts: {
  materias?: unknown[];
  boletimPorMateria?: Record<string, unknown[]>;
  resolvidas?: { alunoId: string; materiaId: string }[];
  alunosComFoto?: { id: string; user: { fotoUrl: string | null } }[];
}) {
  const prisma = {
    materia: {
      findMany: jest
        .fn()
        .mockResolvedValue(opts.materias ?? [MATERIA_ENCERRADA]),
      findUnique: jest.fn().mockResolvedValue({ nome: 'Matemática' }),
    },
    pendenciaResolvida: {
      findMany: jest.fn().mockResolvedValue(opts.resolvidas ?? []),
      upsert: jest.fn().mockResolvedValue({}),
    },
    aluno: {
      findMany: jest.fn().mockResolvedValue(opts.alunosComFoto ?? []),
      findUnique: jest.fn().mockResolvedValue({ nome: 'Fulano' }),
    },
    $transaction: jest.fn(async (ops: Promise<unknown>[]) => Promise.all(ops)),
  };
  const boletim = {
    calcularBoletimMateria: jest.fn((materiaId: string) =>
      Promise.resolve(opts.boletimPorMateria?.[materiaId] ?? []),
    ),
  };
  return {
    service: new PendenciasService(prisma as never, boletim as never),
    prisma,
    boletim,
  };
}

describe('PendenciasService — cálculo ao vivo a partir de disciplinas encerradas', () => {
  it('lista pendente quando o aluno reprovou numa disciplina encerrada e não há resolução', async () => {
    const { service } = criarServico({
      boletimPorMateria: {
        'materia-1': boletimComReprovado('aluno-1', 'Fulano', 'M001'),
      },
    });
    const pendentes = await service.listarPorStatus('PENDENTE');
    expect(pendentes).toHaveLength(1);
    expect(pendentes[0]).toMatchObject({
      id: 'aluno-1',
      nome: 'Fulano',
      totalPendencias: 1,
    });
  });

  it('não lista pendência de disciplina aberta (só ENCERRADA entra no cálculo)', async () => {
    // O próprio prisma.materia.findMany já filtra por ENCERRADA no where — aqui simulamos
    // o retorno vazio que ele daria se não houvesse nenhuma disciplina fechada.
    const { service } = criarServico({ materias: [] });
    const pendentes = await service.listarPorStatus('PENDENTE');
    expect(pendentes).toHaveLength(0);
  });

  it('aluno sem nenhuma pendência retorna lista vazia sem quebrar', async () => {
    const { service } = criarServico({
      boletimPorMateria: { 'materia-1': [] },
    });
    await expect(service.listarPorStatus('PENDENTE')).resolves.toEqual([]);
    await expect(service.pendenciasDoAluno('aluno-x')).resolves.toEqual([]);
  });

  it('move a pendência pra aba Resolvidas depois de resolvida, some de Pendentes', async () => {
    const { service } = criarServico({
      boletimPorMateria: {
        'materia-1': boletimComReprovado('aluno-1', 'Fulano', 'M001'),
      },
      resolvidas: [{ alunoId: 'aluno-1', materiaId: 'materia-1' }],
    });
    const pendentes = await service.listarPorStatus('PENDENTE');
    const resolvidas = await service.listarPorStatus('RESOLVIDA');
    expect(pendentes).toHaveLength(0);
    expect(resolvidas).toHaveLength(1);
    expect(resolvidas[0].id).toBe('aluno-1');
  });

  it('resolver é idempotente: chamar duas vezes não duplica nem falha (upsert)', async () => {
    const { service, prisma } = criarServico({});
    await service.resolver('aluno-1', 'materia-1');
    await service.resolver('aluno-1', 'materia-1');
    expect(prisma.pendenciaResolvida.upsert).toHaveBeenCalledTimes(2);
    expect(prisma.pendenciaResolvida.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          alunoId_materiaId: { alunoId: 'aluno-1', materiaId: 'materia-1' },
        },
      }),
    );
  });

  it('resolverTodasDoAluno só reivindica as pendências ainda não resolvidas', async () => {
    const { service, prisma } = criarServico({
      boletimPorMateria: {
        'materia-1': boletimComReprovado('aluno-1', 'Fulano', 'M001'),
      },
    });
    const resultado = await service.resolverTodasDoAluno('aluno-1');
    expect(resultado.resolvidas).toBe(1);
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it('resolverTodasDoAluno não toca no banco se o aluno já não tem pendência pendente', async () => {
    const { service, prisma } = criarServico({
      boletimPorMateria: {
        'materia-1': boletimComReprovado('aluno-1', 'Fulano', 'M001'),
      },
      resolvidas: [{ alunoId: 'aluno-1', materiaId: 'materia-1' }],
    });
    const resultado = await service.resolverTodasDoAluno('aluno-1');
    expect(resultado.resolvidas).toBe(0);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
