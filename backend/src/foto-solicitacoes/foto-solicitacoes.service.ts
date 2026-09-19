import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { removerArquivo, salvarArquivo } from '../common/arquivos.util';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { StatusSolicitacaoFoto } from '../../generated/prisma/client';

@Injectable()
export class FotoSolicitacoesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  /** Um aluno só tem uma solicitação "em voo" por vez: se já existe uma PENDENTE, o novo
   * envio troca o arquivo dela em vez de criar outra — o aluno está editando a foto que
   * enviou, não abrindo um pedido novo. */
  async criar(alunoId: string, file: Express.Multer.File) {
    const arquivoStagingUrl = await salvarArquivo(
      this.prisma,
      file.buffer,
      file.mimetype,
    );

    const pendente = await this.prisma.solicitacaoFoto.findFirst({
      where: { alunoId, status: StatusSolicitacaoFoto.PENDENTE },
    });
    if (pendente) {
      await removerArquivo(this.prisma, pendente.arquivoStagingUrl);
      return this.prisma.solicitacaoFoto.update({
        where: { id: pendente.id },
        data: { arquivoStagingUrl },
      });
    }

    return this.prisma.solicitacaoFoto.create({
      data: { alunoId, arquivoStagingUrl },
    });
  }

  listarMinhas(alunoId: string) {
    return this.prisma.solicitacaoFoto.findMany({
      where: { alunoId },
      orderBy: { criadaEm: 'desc' },
    });
  }

  listar(status?: StatusSolicitacaoFoto) {
    return this.prisma.solicitacaoFoto.findMany({
      where: status ? { status } : { status: StatusSolicitacaoFoto.PENDENTE },
      include: {
        aluno: { select: { id: true, nome: true, matricula: true } },
      },
      orderBy: { criadaEm: 'asc' },
    });
  }

  private async buscarPendente(id: string) {
    const solicitacao = await this.prisma.solicitacaoFoto.findUnique({
      where: { id },
      include: { aluno: { select: { userId: true, nome: true } } },
    });
    if (!solicitacao) {
      throw new NotFoundException('Solicitação não encontrada');
    }
    if (solicitacao.status !== StatusSolicitacaoFoto.PENDENTE) {
      throw new BadRequestException('Solicitação já foi resolvida');
    }
    return solicitacao;
  }

  async aprovar(id: string) {
    const solicitacao = await this.buscarPendente(id);

    // Reivindica a solicitação atomicamente: só a chamada que ainda encontrar
    // status PENDENTE consegue transicionar pra APROVADA. Evita que um duplo
    // clique (ou dois admins) aprovem a mesma solicitação em paralelo, o que
    // criava um Arquivo órfão e travava a segunda chamada com 404 no meio do caminho.
    const reivindicada = await this.prisma.solicitacaoFoto.updateMany({
      where: { id, status: StatusSolicitacaoFoto.PENDENTE },
      data: { status: StatusSolicitacaoFoto.APROVADA, resolvidaEm: new Date() },
    });
    if (reivindicada.count === 0) {
      throw new BadRequestException('Solicitação já foi resolvida');
    }

    try {
      const arquivoId = solicitacao.arquivoStagingUrl.split('/').pop()!;
      const arquivo = await this.prisma.arquivo.findUniqueOrThrow({
        where: { id: arquivoId },
      });

      await this.usersService.setFoto(
        solicitacao.aluno.userId,
        Buffer.from(arquivo.conteudo),
        arquivo.mimeType,
      );
      await this.prisma.arquivo.delete({ where: { id: arquivoId } });
    } catch (error) {
      // Já reivindicamos a solicitação, mas a aprovação não completou de fato —
      // devolve pra PENDENTE em vez de deixá-la presa como "aprovada" sem a foto trocada.
      await this.prisma.solicitacaoFoto.update({
        where: { id },
        data: { status: StatusSolicitacaoFoto.PENDENTE, resolvidaEm: null },
      });
      throw error;
    }

    const atualizada = await this.prisma.solicitacaoFoto.findUniqueOrThrow({
      where: { id },
    });
    return { ...atualizada, alunoNome: solicitacao.aluno.nome };
  }

  async aprovarTodas() {
    const pendentes = await this.prisma.solicitacaoFoto.findMany({
      where: { status: StatusSolicitacaoFoto.PENDENTE },
      select: { id: true },
    });
    const resultados: Awaited<ReturnType<typeof this.aprovar>>[] = [];
    for (const { id } of pendentes) {
      resultados.push(await this.aprovar(id));
    }
    return resultados;
  }

  async rejeitar(id: string) {
    const solicitacao = await this.buscarPendente(id);
    await removerArquivo(this.prisma, solicitacao.arquivoStagingUrl);

    const atualizada = await this.prisma.solicitacaoFoto.update({
      where: { id },
      data: {
        status: StatusSolicitacaoFoto.REJEITADA,
        resolvidaEm: new Date(),
      },
    });
    return { ...atualizada, alunoNome: solicitacao.aluno.nome };
  }
}
