import { Injectable, NotFoundException } from '@nestjs/common';
import { mkdir, readdir, unlink, writeFile } from 'fs/promises';
import { join } from 'path';
import { EXT_BY_MIME, FOTOS_DIR } from '../common/foto.util';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../../generated/prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(role?: Role) {
    return this.prisma.user.findMany({
      where: role ? { role } : undefined,
      select: {
        id: true,
        login: true,
        role: true,
        precisaTrocarSenha: true,
        fotoUrl: true,
        criadoEm: true,
        professor: { select: { id: true, nome: true } },
        aluno: {
          select: { id: true, nome: true, matricula: true, turmaId: true },
        },
      },
      orderBy: { criadoEm: 'desc' },
    });
  }

  findMe(userId: string) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        login: true,
        role: true,
        precisaTrocarSenha: true,
        fotoUrl: true,
      },
    });
  }

  private async limparFotoAtual(userId: string) {
    const existentes = await readdir(FOTOS_DIR).catch(() => [] as string[]);
    await Promise.all(
      existentes
        .filter((nome) => nome.startsWith(`${userId}.`))
        .map((nome) => unlink(join(FOTOS_DIR, nome)).catch(() => undefined)),
    );
  }

  /** Grava a foto de um usuário a partir de um buffer já validado (upload direto ou aprovação de solicitação). */
  async setFoto(userId: string, buffer: Buffer, ext: string) {
    await mkdir(FOTOS_DIR, { recursive: true });
    await this.limparFotoAtual(userId);

    const nomeArquivo = `${userId}.${ext}`;
    await writeFile(join(FOTOS_DIR, nomeArquivo), buffer);

    const fotoUrl = `/uploads/fotos/${nomeArquivo}`;
    return this.prisma.user.update({
      where: { id: userId },
      data: { fotoUrl },
      select: { id: true, fotoUrl: true },
    });
  }

  updateFotoFromUpload(userId: string, file: Express.Multer.File) {
    const ext = EXT_BY_MIME[file.mimetype];
    return this.setFoto(userId, file.buffer, ext);
  }

  async removerFoto(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    await this.limparFotoAtual(userId);
    return this.prisma.user.update({
      where: { id: userId },
      data: { fotoUrl: null },
      select: { id: true, fotoUrl: true },
    });
  }
}
