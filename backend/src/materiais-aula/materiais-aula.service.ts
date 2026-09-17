import { Injectable, NotFoundException } from '@nestjs/common';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { randomUUID } from 'crypto';
import { extname, join } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/auth.types';
import { MATERIAIS_AULA_DIR } from '../common/foto.util';
import {
  garantirAcessoLeituraMateria,
  garantirPosseProfessor,
} from '../common/posse.util';
import { CreateMaterialAulaDto } from './dto/create-material-aula.dto';

@Injectable()
export class MateriaisAulaService {
  constructor(private readonly prisma: PrismaService) {}

  private async carregarAula(aulaId: string, user: AuthenticatedUser) {
    const aula = await this.prisma.aula.findUnique({
      where: { id: aulaId },
      include: { materia: true },
    });
    if (!aula) {
      throw new NotFoundException('Aula não encontrada');
    }
    await garantirAcessoLeituraMateria(
      this.prisma,
      user,
      aula.materia,
      'Aula não encontrada',
    );
    return aula;
  }

  private async carregarMaterialComPosse(id: string, user: AuthenticatedUser) {
    const material = await this.prisma.materialAula.findUnique({
      where: { id },
      include: { aula: { include: { materia: true } } },
    });
    if (!material) {
      throw new NotFoundException('Material não encontrado');
    }
    garantirPosseProfessor(
      user,
      material.aula.materia.professorId,
      'Material não encontrado',
    );
    return material;
  }

  async criar(
    aulaId: string,
    dto: CreateMaterialAulaDto,
    file: Express.Multer.File,
    user: AuthenticatedUser,
  ) {
    await this.carregarAula(aulaId, user);

    await mkdir(MATERIAIS_AULA_DIR, { recursive: true });
    const ext = extname(file.originalname) || '';
    const nomeArquivo = `${randomUUID()}${ext}`;
    await writeFile(join(MATERIAIS_AULA_DIR, nomeArquivo), file.buffer);

    return this.prisma.materialAula.create({
      data: {
        aulaId,
        titulo: dto.titulo,
        arquivoUrl: `/uploads/materiais-aula/${nomeArquivo}`,
      },
    });
  }

  async listar(aulaId: string, user: AuthenticatedUser) {
    await this.carregarAula(aulaId, user);
    return this.prisma.materialAula.findMany({
      where: { aulaId },
      orderBy: { postadoEm: 'desc' },
    });
  }

  async remover(id: string, user: AuthenticatedUser) {
    const material = await this.carregarMaterialComPosse(id, user);
    const nomeArquivo = material.arquivoUrl.split('/').pop();
    if (nomeArquivo) {
      await unlink(join(MATERIAIS_AULA_DIR, nomeArquivo)).catch(
        () => undefined,
      );
    }
    return this.prisma.materialAula.delete({ where: { id } });
  }
}
