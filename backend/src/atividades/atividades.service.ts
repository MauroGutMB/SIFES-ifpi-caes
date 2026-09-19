import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/auth.types';
import { EstadoMateria, FormatoArquivo } from '../../generated/prisma/client';
import { removerArquivo, salvarArquivo } from '../common/arquivos.util';
import { validarAssinaturaArquivo } from '../common/file-signature.util';
import {
  garantirAcessoLeituraMateria,
  garantirPosseProfessor,
} from '../common/posse.util';
import {
  mimeRegexParaFormato,
  mimeRegexTodosFormatos,
  mimeTiposParaFormato,
  mimeTiposTodosFormatos,
} from './formato-entrega.util';
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

  /** Valida a entrega do aluno contra o formatoExigido da Atividade — tanto o header
   * Content-Type (declarado pelo cliente) quanto os magic bytes reais do conteúdo, que não
   * podem ser falsificados da mesma forma. */
  private validarAnexo(file: Express.Multer.File, formato: FormatoArquivo) {
    const regexEsperado = mimeRegexParaFormato(formato);
    if (!regexEsperado.test(file.mimetype)) {
      throw new BadRequestException(
        `Formato de arquivo inválido — o anexo deve ser do tipo ${formato}`,
      );
    }
    if (!validarAssinaturaArquivo(file.buffer, mimeTiposParaFormato(formato))) {
      throw new BadRequestException(
        'O conteúdo do arquivo não corresponde ao tipo declarado',
      );
    }
  }

  /** O anexo do professor (enunciado/material da Atividade) pode ser qualquer formato que o
   * sistema aceita — PNG, JPEG, Word ou PDF — independente do formatoExigido, que é uma regra
   * sobre o que o ALUNO vai entregar, não sobre o material do professor. */
  private validarAnexoProfessor(file: Express.Multer.File) {
    if (!mimeRegexTodosFormatos().test(file.mimetype)) {
      throw new BadRequestException(
        'Formato de arquivo inválido — o anexo deve ser PNG, JPEG, Word ou PDF',
      );
    }
    if (!validarAssinaturaArquivo(file.buffer, mimeTiposTodosFormatos())) {
      throw new BadRequestException(
        'O conteúdo do arquivo não corresponde ao tipo declarado',
      );
    }
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
    if (anexo) {
      this.validarAnexoProfessor(anexo);
    }
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
      this.validarAnexoProfessor(anexo);
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

    this.validarAnexo(file, atividade.formatoExigido);

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
