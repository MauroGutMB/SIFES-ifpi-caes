import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/auth.types';
import { agoraComoBrasiliaFake } from '../common/tempo.util';

@Injectable()
export class LogsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Resolve um nome legível pro usuário que fez a ação — nunca falha o registro do log por
   * causa disso (login como último recurso). */
  private async nomeDoUsuario(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        login: true,
        professor: { select: { nome: true } },
        aluno: { select: { nome: true } },
      },
    });
    return (
      user?.professor?.nome ??
      user?.aluno?.nome ??
      user?.login ??
      'Usuário removido'
    );
  }

  /** Grava um log de auditoria — vinculado ao semestre vigente no momento da ação (não ao
   * semestre de nenhuma entidade específica), pra "apagar logs do semestre" ter um significado
   * único e sem ambiguidade. Nunca lança: um log que falha não pode derrubar a ação real. */
  async registrar(
    acao: string,
    alvo: string,
    user: AuthenticatedUser | undefined,
  ): Promise<void> {
    if (!user) return;
    try {
      const hoje = agoraComoBrasiliaFake();
      const [usuarioNome, semestreAtual] = await Promise.all([
        this.nomeDoUsuario(user.id),
        this.prisma.semestre.findFirst({
          where: { dataInicio: { lte: hoje }, dataFim: { gte: hoje } },
        }),
      ]);
      await this.prisma.logAuditoria.create({
        data: {
          acao,
          alvo,
          usuarioId: user.id,
          usuarioNome,
          semestreId: semestreAtual?.id,
        },
      });
    } catch {
      // Log é observabilidade, não deve nunca quebrar a ação que está sendo registrada.
    }
  }

  listar(semestreId?: string) {
    return this.prisma.logAuditoria.findMany({
      where: semestreId ? { semestreId } : undefined,
      orderBy: { criadoEm: 'desc' },
    });
  }

  async apagarDoSemestre(semestreId: string): Promise<{ removidos: number }> {
    const resultado = await this.prisma.logAuditoria.deleteMany({
      where: { semestreId },
    });
    return { removidos: resultado.count };
  }
}
