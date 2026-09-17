import { Injectable, NotFoundException } from '@nestjs/common';
import { removerArquivo, salvarArquivo } from '../common/arquivos.util';
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

  /** Grava a foto de um usuário a partir de um buffer já validado (upload direto ou aprovação de solicitação). */
  async setFoto(userId: string, buffer: Buffer, mimeType: string) {
    const atual = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { fotoUrl: true },
    });
    await removerArquivo(this.prisma, atual?.fotoUrl);

    const fotoUrl = await salvarArquivo(this.prisma, buffer, mimeType);
    return this.prisma.user.update({
      where: { id: userId },
      data: { fotoUrl },
      select: { id: true, fotoUrl: true },
    });
  }

  updateFotoFromUpload(userId: string, file: Express.Multer.File) {
    return this.setFoto(userId, file.buffer, file.mimetype);
  }

  async removerFoto(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    await removerArquivo(this.prisma, user.fotoUrl);
    return this.prisma.user.update({
      where: { id: userId },
      data: { fotoUrl: null },
      select: { id: true, fotoUrl: true },
    });
  }
}
