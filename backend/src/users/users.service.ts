import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { removerArquivo, salvarArquivo } from '../common/arquivos.util';
import { gerarSenhaInicial } from '../common/password.util';
import { parseCsv } from '../common/csv.util';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../../generated/prisma/client';
import { AlunosService } from '../alunos/alunos.service';
import { ProfessoresService } from '../professores/professores.service';
import { CreateAlunoDto } from '../alunos/dto/create-aluno.dto';
import { CreateProfessorDto } from '../professores/dto/create-professor.dto';
import type {
  ErroImportacaoDto,
  ImportarUsuariosResultadoDto,
  UsuarioImportadoDto,
} from './dto/importar-usuarios-resultado.dto';

const COLUNAS_MODELO = ['nome', 'login', 'cargo'];
export const MODELO_IMPORTACAO_CSV =
  'nome,login,cargo\r\nMaria da Silva,12345678,ALUNO\r\nJoão Souza,joao.souza@ifpi.edu.br,PROFESSOR\r\n';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly alunosService: AlunosService,
    private readonly professoresService: ProfessoresService,
  ) {}

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

  /** Gera uma nova senha temporária pro usuário e força a troca no próximo login — usado só
   * quando ele ainda NÃO está marcado pra trocar senha (senão já vai trocar de qualquer jeito
   * no próximo login, e refazer isso só invalidaria a sessão dele à toa). Revoga as sessões
   * ativas (refresh tokens), já que a senha antiga não vale mais a partir de agora. */
  async resetarSenha(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const senhaInicial = gerarSenhaInicial();
    const senhaHash = await bcrypt.hash(senhaInicial, 10);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { senhaHash, precisaTrocarSenha: true },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId, revogadoEm: null },
        data: { revogadoEm: new Date() },
      }),
    ]);

    return { login: user.login, senhaInicial };
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

  gerarModeloImportacao(): Buffer {
    return Buffer.from(MODELO_IMPORTACAO_CSV, 'utf-8');
  }

  /** Cria alunos e professores em lote a partir de um CSV (nome,login,cargo) — cada linha é
   * criada com o mesmo fluxo de sempre (senha inicial gerada, precisaTrocarSenha=true por
   * padrão), então uma linha ruim não afeta as outras: erro por linha, não aborta o lote. */
  async importarUsuarios(
    arquivo: Buffer,
  ): Promise<ImportarUsuariosResultadoDto> {
    const linhas = parseCsv(arquivo.toString('utf-8'));
    if (linhas.length === 0) {
      throw new BadRequestException('Arquivo CSV vazio');
    }

    const [cabecalho, ...dados] = linhas;
    const cabecalhoValido = COLUNAS_MODELO.every(
      (coluna, indice) => cabecalho[indice]?.toLowerCase() === coluna,
    );
    if (!cabecalhoValido) {
      throw new BadRequestException(
        `Cabeçalho do CSV deve ser exatamente "nome,login,cargo" (recebido: "${cabecalho.join(',')}")`,
      );
    }

    const importados: UsuarioImportadoDto[] = [];
    const erros: ErroImportacaoDto[] = [];

    for (const [indice, colunas] of dados.entries()) {
      const linha = indice + 2; // +1 pra base 1, +1 pelo cabeçalho
      const [nome, login, cargoBruto] = colunas;
      const cargo = cargoBruto?.trim().toUpperCase();

      if (!nome?.trim() || !login?.trim() || !cargo) {
        erros.push({ linha, motivo: 'nome, login e cargo são obrigatórios' });
        continue;
      }
      if (cargo !== 'ALUNO' && cargo !== 'PROFESSOR') {
        erros.push({
          linha,
          motivo: `cargo deve ser "ALUNO" ou "PROFESSOR" (recebido: "${cargoBruto}")`,
        });
        continue;
      }

      try {
        if (cargo === 'ALUNO') {
          const dto = plainToInstance(CreateAlunoDto, {
            nome,
            matricula: login,
          });
          const problemas = await validate(dto);
          if (problemas.length > 0) {
            throw new BadRequestException(
              problemas
                .flatMap((p) => Object.values(p.constraints ?? {}))
                .join('; '),
            );
          }
          const criado = await this.alunosService.create(dto);
          importados.push({
            linha,
            nome,
            login,
            cargo,
            senhaInicial: criado.senhaInicial,
          });
        } else {
          const dto = plainToInstance(CreateProfessorDto, {
            nome,
            email: login,
          });
          const problemas = await validate(dto);
          if (problemas.length > 0) {
            throw new BadRequestException(
              problemas
                .flatMap((p) => Object.values(p.constraints ?? {}))
                .join('; '),
            );
          }
          const criado = await this.professoresService.create(dto);
          importados.push({
            linha,
            nome,
            login,
            cargo,
            senhaInicial: criado.senhaInicial,
          });
        }
      } catch (error) {
        const motivo =
          error instanceof ConflictException ||
          error instanceof BadRequestException
            ? ((error.getResponse() as { message?: string }).message ??
              error.message)
            : 'Não foi possível criar esse usuário';
        erros.push({ linha, motivo });
      }
    }

    return { importados, erros };
  }
}
