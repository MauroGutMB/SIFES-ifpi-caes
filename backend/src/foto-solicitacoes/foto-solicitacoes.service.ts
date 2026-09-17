import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { mkdir, readFile, unlink, writeFile } from 'fs/promises';
import { randomUUID } from 'crypto';
import { extname, join } from 'path';
import { EXT_BY_MIME, FOTOS_PENDENTES_DIR } from '../common/foto.util';
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
    await mkdir(FOTOS_PENDENTES_DIR, { recursive: true });
    const ext = EXT_BY_MIME[file.mimetype];
    const nomeArquivo = `${randomUUID()}.${ext}`;
    await writeFile(join(FOTOS_PENDENTES_DIR, nomeArquivo), file.buffer);

    const pendente = await this.prisma.solicitacaoFoto.findFirst({
      where: { alunoId, status: StatusSolicitacaoFoto.PENDENTE },
    });
    if (pendente) {
      await unlink(join(FOTOS_PENDENTES_DIR, pendente.arquivoStagingUrl)).catch(
        () => undefined,
      );
      return this.prisma.solicitacaoFoto.update({
        where: { id: pendente.id },
        data: { arquivoStagingUrl: nomeArquivo },
      });
    }

    return this.prisma.solicitacaoFoto.create({
      data: { alunoId, arquivoStagingUrl: nomeArquivo },
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
      include: { aluno: { select: { userId: true } } },
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
    const caminho = join(FOTOS_PENDENTES_DIR, solicitacao.arquivoStagingUrl);
    const buffer = await readFile(caminho);
    const ext = extname(solicitacao.arquivoStagingUrl).slice(1);

    await this.usersService.setFoto(solicitacao.aluno.userId, buffer, ext);
    await unlink(caminho).catch(() => undefined);

    return this.prisma.solicitacaoFoto.update({
      where: { id },
      data: { status: StatusSolicitacaoFoto.APROVADA, resolvidaEm: new Date() },
    });
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
    const caminho = join(FOTOS_PENDENTES_DIR, solicitacao.arquivoStagingUrl);
    await unlink(caminho).catch(() => undefined);

    return this.prisma.solicitacaoFoto.update({
      where: { id },
      data: {
        status: StatusSolicitacaoFoto.REJEITADA,
        resolvidaEm: new Date(),
      },
    });
  }
}
