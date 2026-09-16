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
      return { ...professor, senhaInicial };
    } catch (error) {
      rethrowAsConflict(error, 'Já existe um professor com este e-mail');
    }
  }

  findAll() {
    return this.prisma.professor.findMany({ orderBy: { nome: 'asc' } });
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

  remove(id: string) {
    return this.prisma.professor.delete({ where: { id } });
  }
}
