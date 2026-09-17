import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/auth.types';
import { garantirPosseProfessor } from '../common/posse.util';
import { calcularEstadoAula } from './estado-aula.util';
import { UpdateAulaDto } from './dto/update-aula.dto';
import { SetFrequenciasDto } from './dto/set-frequencias.dto';
import { OverrideAulaDto } from './dto/override-aula.dto';

@Injectable()
export class AulasService {
  constructor(private readonly prisma: PrismaService) {}

  /** Checagem de posse: professor só acessa Aulas de Matérias em que é responsável. */
  private async carregarAulaComPosse(id: string, user: AuthenticatedUser) {
    const aula = await this.prisma.aula.findUnique({
      where: { id },
      include: { materia: true },
    });
    if (!aula) {
      throw new NotFoundException('Aula não encontrada');
    }
    garantirPosseProfessor(
      user,
      aula.materia.professorId,
      'Aula não encontrada',
    );
    return aula;
  }

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

  async findAllPorMateria(materiaId: string, user: AuthenticatedUser) {
    await this.carregarMateriaComPosse(materiaId, user);
    const aulas = await this.prisma.aula.findMany({
      where: { materiaId },
      orderBy: { data: 'asc' },
    });
    return aulas.map((aula) => ({ ...aula, estado: calcularEstadoAula(aula) }));
  }

  async findOne(id: string, user: AuthenticatedUser) {
    const aula = await this.carregarAulaComPosse(id, user);
    const frequencias = await this.prisma.frequencia.findMany({
      where: { aulaId: id },
      include: { aluno: { select: { id: true, nome: true, matricula: true } } },
    });
    return { ...aula, estado: calcularEstadoAula(aula), frequencias };
  }

  async update(id: string, dto: UpdateAulaDto, user: AuthenticatedUser) {
    const aula = await this.carregarAulaComPosse(id, user);
    if (calcularEstadoAula(aula) !== 'LANCADO') {
      throw new BadRequestException(
        'Aula só pode ser editada enquanto estiver no estado lançado',
      );
    }
    return this.prisma.aula.update({
      where: { id },
      data: { titulo: dto.titulo, descricao: dto.descricao },
    });
  }

  async setFrequencias(
    id: string,
    dto: SetFrequenciasDto,
    user: AuthenticatedUser,
  ) {
    const aula = await this.carregarAulaComPosse(id, user);
    if (calcularEstadoAula(aula) !== 'LANCADO') {
      throw new BadRequestException(
        'Frequência só pode ser lançada enquanto a Aula estiver no estado lançado',
      );
    }

    const alunoIds = dto.frequencias.map((f) => f.alunoId);
    const vinculados = await this.prisma.vinculoAlunoMateria.count({
      where: { materiaId: aula.materiaId, alunoId: { in: alunoIds } },
    });
    if (vinculados !== alunoIds.length) {
      throw new BadRequestException(
        'Todos os alunos devem estar vinculados a esta Matéria',
      );
    }

    await this.prisma.$transaction(
      dto.frequencias.map((item) =>
        this.prisma.frequencia.upsert({
          where: { aulaId_alunoId: { aulaId: id, alunoId: item.alunoId } },
          create: { aulaId: id, alunoId: item.alunoId, status: item.status },
          update: { status: item.status },
        }),
      ),
    );

    return this.prisma.frequencia.findMany({
      where: { aulaId: id },
      include: { aluno: { select: { id: true, nome: true, matricula: true } } },
    });
  }

  async override(id: string, dto: OverrideAulaDto) {
    // Ação exclusiva do admin (garantido pelo @Roles no controller) — não passa por posse de professor.
    const aula = await this.prisma.aula.findUnique({ where: { id } });
    if (!aula) {
      throw new NotFoundException('Aula não encontrada');
    }
    return this.prisma.aula.update({
      where: { id },
      data: { estadoOverride: dto.estado },
    });
  }
}
