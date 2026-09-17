import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { gerarSenhaInicial } from '../common/password.util';
import { rethrowAsConflict } from '../common/prisma-error.util';
import { CreateAlunoDto } from './dto/create-aluno.dto';
import { UpdateAlunoDto } from './dto/update-aluno.dto';

@Injectable()
export class AlunosService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAlunoDto) {
    const senhaInicial = gerarSenhaInicial();
    const senhaHash = await bcrypt.hash(senhaInicial, 10);

    try {
      const aluno = await this.prisma.aluno.create({
        data: {
          nome: dto.nome,
          matricula: dto.matricula,
          user: {
            create: { login: dto.matricula, senhaHash, role: 'ALUNO' },
          },
        },
      });
      return { ...aluno, senhaInicial };
    } catch (error) {
      rethrowAsConflict(error, 'Já existe um aluno com esta matrícula');
    }
  }

  findAll(turmaId?: string) {
    return this.prisma.aluno.findMany({
      where: turmaId ? { turmaId } : undefined,
      orderBy: { nome: 'asc' },
    });
  }

  findOne(id: string) {
    return this.prisma.aluno.findUniqueOrThrow({
      where: { id },
      include: { turma: true },
    });
  }

  meuPerfil(alunoId: string) {
    return this.prisma.aluno.findUniqueOrThrow({
      where: { id: alunoId },
      include: { turma: { include: { semestre: true } } },
    });
  }

  async update(id: string, dto: UpdateAlunoDto) {
    try {
      return await this.prisma.aluno.update({
        where: { id },
        data: {
          nome: dto.nome,
          matricula: dto.matricula,
          user: dto.matricula
            ? { update: { login: dto.matricula } }
            : undefined,
        },
      });
    } catch (error) {
      rethrowAsConflict(error, 'Já existe um aluno com esta matrícula');
    }
  }

  async remove(id: string) {
    const aluno = await this.prisma.aluno.findUniqueOrThrow({ where: { id } });
    // Cascata: remover o User remove o Aluno junto (onDelete: Cascade no schema).
    return this.prisma.user.delete({ where: { id: aluno.userId } });
  }

  async vincularTurma(id: string, turmaId: string) {
    const aluno = await this.prisma.aluno.findUniqueOrThrow({ where: { id } });
    if (aluno.turmaId) {
      throw new BadRequestException(
        'Aluno já possui turma vinculada — desligue da turma atual antes de vincular a uma nova',
      );
    }

    const turma = await this.prisma.turma.findUnique({
      where: { id: turmaId },
      include: { materias: true },
    });
    if (!turma) {
      throw new NotFoundException('Turma não encontrada');
    }

    return this.prisma.$transaction(async (tx) => {
      const atualizado = await tx.aluno.update({
        where: { id },
        data: { turmaId },
      });
      if (turma.materias.length > 0) {
        await tx.vinculoAlunoMateria.createMany({
          data: turma.materias.map((materia) => ({
            alunoId: id,
            materiaId: materia.id,
          })),
          skipDuplicates: true,
        });
      }
      return atualizado;
    });
  }

  desligarTurma(id: string) {
    return this.prisma.aluno.update({
      where: { id },
      data: { turmaId: null },
    });
  }

  async adicionarMateria(alunoId: string, materiaId: string) {
    await this.prisma.aluno.findUniqueOrThrow({ where: { id: alunoId } });
    await this.prisma.materia.findUniqueOrThrow({ where: { id: materiaId } });

    try {
      return await this.prisma.vinculoAlunoMateria.create({
        data: { alunoId, materiaId },
      });
    } catch (error) {
      rethrowAsConflict(error, 'Aluno já está vinculado a esta matéria');
    }
  }

  async removerMateria(alunoId: string, materiaId: string) {
    const resultado = await this.prisma.vinculoAlunoMateria.deleteMany({
      where: { alunoId, materiaId },
    });
    if (resultado.count === 0) {
      throw new NotFoundException('Aluno não está vinculado a esta matéria');
    }
    return resultado;
  }
}
