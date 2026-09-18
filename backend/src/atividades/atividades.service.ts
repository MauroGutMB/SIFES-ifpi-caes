import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/auth.types';
import { EstadoMateria } from '../../generated/prisma/client';
import { removerArquivo, salvarArquivo } from '../common/arquivos.util';
import {
  garantirAcessoLeituraMateria,
  garantirPosseProfessor,
} from '../common/posse.util';
import { mimeRegexParaFormato } from './formato-entrega.util';
import { CreateAtividadeDto } from './dto/create-atividade.dto';
import { UpdateAtividadeDto } from './dto/update-atividade.dto';

@Injectable()
export class AtividadesService {
  constructor(private readonly prisma: PrismaService) {}

  private async carregarMateria(materiaId: string, user: AuthenticatedUser) {
    const materia = await this.prisma.materia.findUnique({
      where: { id: materiaId },
    });
    if (!materia) {
      throw new NotFoundException('Disciplina não encontrada');
    }
    await garantirAcessoLeituraMateria(
      this.prisma,
      user,
      materia,
      'Disciplina não encontrada',
    );
    return materia;
  }

  private garantirAberta(materia: { estado: EstadoMateria }) {
    if (materia.estado !== EstadoMateria.ABERTA) {
      throw new BadRequestException(
        'Só é possível gerenciar Atividades enquanto a Disciplina estiver aberta',
      );
    }
  }

  private async carregarAtividadeComPosseProfessor(
    id: string,
    user: AuthenticatedUser,
  ) {
    const atividade = await this.prisma.atividade.findUnique({
      where: { id },
      include: { materia: true },
    });
    if (!atividade) {
      throw new NotFoundException('Atividade não encontrada');
    }
    garantirPosseProfessor(
      user,
      atividade.materia.professorId,
      'Atividade não encontrada',
    );
    return atividade;
  }

  private salvarAnexo(file: Express.Multer.File): Promise<string> {
    return salvarArquivo(this.prisma, file.buffer, file.mimetype);
  }

  private removerAnexo(arquivoUrl: string | null) {
    return removerArquivo(this.prisma, arquivoUrl);
  }

  async criar(
    materiaId: string,
    dto: CreateAtividadeDto,
    user: AuthenticatedUser,
    anexo?: Express.Multer.File,
  ) {
    const materia = await this.carregarMateria(materiaId, user);
    this.garantirAberta(materia);
    return this.prisma.atividade.create({
      data: {
        materiaId,
        titulo: dto.titulo,
        descricao: dto.descricao,
        formatoExigido: dto.formatoExigido,
        prazo: new Date(dto.prazo),
        arquivoUrl: anexo ? await this.salvarAnexo(anexo) : null,
      },
    });
  }

  async listarPorMateria(materiaId: string, user: AuthenticatedUser) {
    await this.carregarMateria(materiaId, user);
    return this.prisma.atividade.findMany({
      where: { materiaId },
      orderBy: { criadaEm: 'desc' },
    });
  }

  async atualizar(
    id: string,
    dto: UpdateAtividadeDto,
    user: AuthenticatedUser,
    anexo?: Express.Multer.File,
  ) {
    const atividade = await this.carregarAtividadeComPosseProfessor(id, user);
    this.garantirAberta(atividade.materia);
    let arquivoUrl = atividade.arquivoUrl;
    if (anexo) {
      await this.removerAnexo(atividade.arquivoUrl);
      arquivoUrl = await this.salvarAnexo(anexo);
    }
    return this.prisma.atividade.update({
      where: { id },
      data: {
        titulo: dto.titulo,
        descricao: dto.descricao,
        formatoExigido: dto.formatoExigido,
        prazo: dto.prazo ? new Date(dto.prazo) : undefined,
        arquivoUrl,
      },
    });
  }

  async remover(id: string, user: AuthenticatedUser) {
    const atividade = await this.carregarAtividadeComPosseProfessor(id, user);
    this.garantirAberta(atividade.materia);
    await this.removerAnexo(atividade.arquivoUrl);
    return this.prisma.atividade.delete({ where: { id } });
  }

  async listarEntregas(atividadeId: string, user: AuthenticatedUser) {
    await this.carregarAtividadeComPosseProfessor(atividadeId, user);
    return this.prisma.entrega.findMany({
      where: { atividadeId },
      include: { aluno: { select: { id: true, nome: true, matricula: true } } },
      orderBy: { enviadoEm: 'desc' },
    });
  }

  async entregar(
    atividadeId: string,
    file: Express.Multer.File,
    user: AuthenticatedUser,
  ) {
    const atividade = await this.prisma.atividade.findUnique({
      where: { id: atividadeId },
      include: { materia: true },
    });
    if (!atividade) {
      throw new NotFoundException('Atividade não encontrada');
    }
    this.garantirAberta(atividade.materia);
    if (atividade.prazo && new Date() > atividade.prazo) {
      throw new BadRequestException(
        'O prazo de entrega desta Atividade já passou',
      );
    }

    const vinculado = await this.prisma.vinculoAlunoMateria.findUnique({
      where: {
        alunoId_materiaId: {
          alunoId: user.alunoId!,
          materiaId: atividade.materiaId,
        },
      },
    });
    if (!vinculado) {
      throw new BadRequestException(
        'Você não está vinculado à Disciplina desta Atividade',
      );
    }

    const regexEsperado = mimeRegexParaFormato(atividade.formatoExigido);
    if (!regexEsperado.test(file.mimetype)) {
      throw new BadRequestException(
        `Formato de arquivo inválido — esta Atividade exige ${atividade.formatoExigido}`,
      );
    }

    const arquivoUrl = await salvarArquivo(
      this.prisma,
      file.buffer,
      file.mimetype,
    );

    const existente = await this.prisma.entrega.findUnique({
      where: {
        atividadeId_alunoId: { atividadeId, alunoId: user.alunoId! },
      },
    });
    if (existente) {
      await removerArquivo(this.prisma, existente.arquivoUrl);
    }

    return this.prisma.entrega.upsert({
      where: { atividadeId_alunoId: { atividadeId, alunoId: user.alunoId! } },
      create: { atividadeId, alunoId: user.alunoId!, arquivoUrl },
      update: { arquivoUrl },
    });
  }

  minhaEntrega(atividadeId: string, user: AuthenticatedUser) {
    return this.prisma.entrega.findUnique({
      where: {
        atividadeId_alunoId: { atividadeId, alunoId: user.alunoId! },
      },
    });
  }
}
