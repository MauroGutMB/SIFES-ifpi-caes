import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { gerarSenhaInicial } from '../common/password.util';
import { rethrowAsConflict } from '../common/prisma-error.util';
import { CreateProfessorDto } from './dto/create-professor.dto';
import { UpdateProfessorDto } from './dto/update-professor.dto';

@Injectable()
export class ProfessoresService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProfessorDto) {
    const senhaInicial = gerarSenhaInicial();
    const senhaHash = await bcrypt.hash(senhaInicial, 10);

    try {
      const professor = await this.prisma.professor.create({
        data: {
          nome: dto.nome,
          email: dto.email,
          user: {
            create: { login: dto.email, senhaHash, role: 'PROFESSOR' },
          },
        },
      });
      return { ...professor, fotoUrl: null, senhaInicial };
    } catch (error) {
      rethrowAsConflict(error, 'Já existe um professor com este e-mail');
    }
  }

  async findAll() {
    const professores = await this.prisma.professor.findMany({
      include: { user: { select: { fotoUrl: true } } },
      orderBy: { nome: 'asc' },
    });
    return professores.map(({ user, ...professor }) => ({
      ...professor,
      fotoUrl: user.fotoUrl,
    }));
  }

  findOne(id: string) {
    return this.prisma.professor.findUniqueOrThrow({
      where: { id },
      include: { materias: true },
    });
  }

  async update(id: string, dto: UpdateProfessorDto) {
    try {
      return await this.prisma.professor.update({
        where: { id },
        data: {
          nome: dto.nome,
          email: dto.email,
          user: dto.email ? { update: { login: dto.email } } : undefined,
        },
      });
    } catch (error) {
      rethrowAsConflict(error, 'Já existe um professor com este e-mail');
    }
  }

  async remove(id: string) {
    const professor = await this.prisma.professor.findUniqueOrThrow({
      where: { id },
    });
    // Cascata: remover o User remove o Professor junto (onDelete: Cascade no schema).
    return this.prisma.user.delete({ where: { id: professor.userId } });
  }
}
