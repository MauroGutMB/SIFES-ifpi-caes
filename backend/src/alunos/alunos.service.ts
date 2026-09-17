import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { BoletimService } from '../boletim/boletim.service';
import { gerarSenhaInicial } from '../common/password.util';
import { rethrowAsConflict } from '../common/prisma-error.util';
import { CreateAlunoDto } from './dto/create-aluno.dto';
import { UpdateAlunoDto } from './dto/update-aluno.dto';
import { MeuSemestreDto } from './dto/meu-semestre.dto';

@Injectable()
export class AlunosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly boletim: BoletimService,
  ) {}

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

  /**
   * Histórico de semestres do aluno, derivado dos vínculos aluno-matéria (nada é apagado ao
   * trocar de semestre — ver regras-negocio.md). Um por semestre distinto que ele já teve
   * matéria vinculada, com um resumo de situação (aprovado/reprovado/cursando) calculado a
   * partir do boletim de cada matéria daquele semestre.
   */
  async meusSemestres(alunoId: string) {
    const aluno = await this.prisma.aluno.findUniqueOrThrow({
      where: { id: alunoId },
    });

    const vinculos = await this.prisma.vinculoAlunoMateria.findMany({
      where: { alunoId },
      include: {
        materia: { include: { turma: { include: { semestre: true } } } },
      },
    });

    const porSemestre = new Map<string, typeof vinculos>();
    for (const vinculo of vinculos) {
      const semestreId = vinculo.materia.turma.semestreId;
      const lista = porSemestre.get(semestreId) ?? [];
      lista.push(vinculo);
      porSemestre.set(semestreId, lista);
    }

    const resultado: MeuSemestreDto[] = [];
    for (const [, vinculosDoSemestre] of porSemestre) {
      const primeiro = vinculosDoSemestre[0].materia.turma;
      let aprovadas = 0;
      let reprovadas = 0;
      let cursando = 0;

      for (const vinculo of vinculosDoSemestre) {
        const boletim = await this.boletim.calcularBoletimMateria(
          vinculo.materiaId,
        );
        const linha = boletim.find((b) => b.aluno.id === alunoId);
        if (linha?.situacao === 'APROVADO') aprovadas++;
        else if (linha?.situacao === 'REPROVADO') reprovadas++;
        else cursando++;
      }

      resultado.push({
        semestre: primeiro.semestre,
        turma: {
          cursoTecnico: primeiro.cursoTecnico,
          anoSerie: primeiro.anoSerie,
          turno: primeiro.turno,
        },
        atual: primeiro.id === aluno.turmaId,
        totalMaterias: vinculosDoSemestre.length,
        aprovadas,
        reprovadas,
        cursando,
      });
    }

    resultado.sort(
      (a, b) =>
        b.semestre.dataInicio.getTime() - a.semestre.dataInicio.getTime(),
    );
    return resultado;
  }
}
