import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { randomUUID } from 'crypto';
import { join } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/auth.types';
import { EstadoMateria } from '../../generated/prisma/client';
import { ENTREGAS_DIR } from '../common/foto.util';
import { garantirPosseProfessor } from '../common/posse.util';
import { extensaoPorMime, mimeRegexParaFormato } from './formato-entrega.util';
import { CreateAtividadeDto } from './dto/create-atividade.dto';
import { UpdateAtividadeDto } from './dto/update-atividade.dto';

@Injectable()
export class AtividadesService {
  constructor(private readonly prisma: PrismaService) {}

  private async carregarMateriaComPosse(
    materiaId: string,
    user: AuthenticatedUser,
  ) {
    const materia = await this.prisma.materia.findUnique({
      where: { id: materiaId },
    });
    if (!materia) {
      throw new NotFoundException('Matéria não encontrada');
    }
    garantirPosseProfessor(user, materia.professorId, 'Matéria não encontrada');
    return materia;
  }

  private garantirAberta(materia: { estado: EstadoMateria }) {
    if (materia.estado !== EstadoMateria.ABERTA) {
      throw new BadRequestException(
        'Só é possível gerenciar Atividades enquanto a Matéria estiver aberta',
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

  async criar(
    materiaId: string,
    dto: CreateAtividadeDto,
    user: AuthenticatedUser,
  ) {
    const materia = await this.carregarMateriaComPosse(materiaId, user);
    this.garantirAberta(materia);
    return this.prisma.atividade.create({
      data: {
        materiaId,
        titulo: dto.titulo,
        descricao: dto.descricao,
        formatoExigido: dto.formatoExigido,
      },
    });
  }

  async listarPorMateria(materiaId: string, user: AuthenticatedUser) {
    await this.carregarMateriaComPosse(materiaId, user);
    return this.prisma.atividade.findMany({
      where: { materiaId },
      orderBy: { criadaEm: 'desc' },
    });
  }

  async atualizar(
    id: string,
    dto: UpdateAtividadeDto,
    user: AuthenticatedUser,
  ) {
    const atividade = await this.carregarAtividadeComPosseProfessor(id, user);
    this.garantirAberta(atividade.materia);
    return this.prisma.atividade.update({
      where: { id },
      data: {
        titulo: dto.titulo,
        descricao: dto.descricao,
        formatoExigido: dto.formatoExigido,
      },
    });
  }

  async remover(id: string, user: AuthenticatedUser) {
    const atividade = await this.carregarAtividadeComPosseProfessor(id, user);
    this.garantirAberta(atividade.materia);
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
        'Você não está vinculado à Matéria desta Atividade',
      );
    }

    const regexEsperado = mimeRegexParaFormato(atividade.formatoExigido);
    if (!regexEsperado.test(file.mimetype)) {
      throw new BadRequestException(
        `Formato de arquivo inválido — esta Atividade exige ${atividade.formatoExigido}`,
      );
    }

    await mkdir(ENTREGAS_DIR, { recursive: true });
    const nomeArquivo = `${randomUUID()}.${extensaoPorMime(file.mimetype)}`;
    await writeFile(join(ENTREGAS_DIR, nomeArquivo), file.buffer);

    const existente = await this.prisma.entrega.findUnique({
      where: {
        atividadeId_alunoId: { atividadeId, alunoId: user.alunoId! },
      },
    });
    if (existente) {
      const nomeAntigo = existente.arquivoUrl.split('/').pop();
      if (nomeAntigo) {
        await unlink(join(ENTREGAS_DIR, nomeAntigo)).catch(() => undefined);
      }
    }

    return this.prisma.entrega.upsert({
      where: { atividadeId_alunoId: { atividadeId, alunoId: user.alunoId! } },
      create: {
        atividadeId,
        alunoId: user.alunoId!,
        arquivoUrl: `/uploads/entregas/${nomeArquivo}`,
      },
      update: { arquivoUrl: `/uploads/entregas/${nomeArquivo}` },
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
