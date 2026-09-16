import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload } from './auth.types';

const REFRESH_TOKEN_BYTES = 48;

interface TokenPair {
  id: string;
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: Date;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private parseExpiresIn(expiresIn: string): number {
    const match = /^(\d+)([smhd])$/.exec(expiresIn);
    if (!match) return 0;
    const value = Number(match[1]);
    const unit = match[2];
    const unitMs =
      { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit] ?? 0;
    return value * unitMs;
  }

  private async issueTokenPair(payload: JwtPayload): Promise<TokenPair> {
    const accessToken = this.jwt.sign(payload, {
      secret: this.config.getOrThrow('JWT_ACCESS_SECRET'),
      expiresIn: this.config.getOrThrow('JWT_ACCESS_EXPIRES_IN'),
    });

    const refreshToken = randomBytes(REFRESH_TOKEN_BYTES).toString('hex');
    const refreshExpiresIn = this.config.getOrThrow<string>(
      'JWT_REFRESH_EXPIRES_IN',
    );
    const refreshExpiresAt = new Date(
      Date.now() + this.parseExpiresIn(refreshExpiresIn),
    );

    const created = await this.prisma.refreshToken.create({
      data: {
        userId: payload.sub,
        tokenHash: this.hashToken(refreshToken),
        expiraEm: refreshExpiresAt,
      },
    });

    return { id: created.id, accessToken, refreshToken, refreshExpiresAt };
  }

  private async loadPayload(userId: string): Promise<JwtPayload> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { professor: true, aluno: true },
    });
    return {
      sub: user.id,
      role: user.role,
      professorId: user.professor?.id,
      alunoId: user.aluno?.id,
    };
  }

  async login(login: string, senha: string) {
    const user = await this.prisma.user.findUnique({
      where: { login },
      include: { professor: true, aluno: true },
    });
    if (!user || !(await bcrypt.compare(senha, user.senhaHash))) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const payload: JwtPayload = {
      sub: user.id,
      role: user.role,
      professorId: user.professor?.id,
      alunoId: user.aluno?.id,
    };
    const tokens = await this.issueTokenPair(payload);

    return {
      ...tokens,
      role: user.role,
      precisaTrocarSenha: user.precisaTrocarSenha,
    };
  }

  async refresh(rawRefreshToken: string | undefined) {
    if (!rawRefreshToken) {
      throw new UnauthorizedException('Refresh token ausente');
    }
    const tokenHash = this.hashToken(rawRefreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!stored) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    if (stored.revogadoEm || stored.expiraEm < new Date()) {
      // Reuso de token já rotacionado/expirado: revoga toda a sessão do usuário.
      await this.prisma.refreshToken.updateMany({
        where: { userId: stored.userId, revogadoEm: null },
        data: { revogadoEm: new Date() },
      });
      throw new UnauthorizedException('Sessão inválida, faça login novamente');
    }

    const payload = await this.loadPayload(stored.userId);
    const tokens = await this.issueTokenPair(payload);

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revogadoEm: new Date(), substituidoPorId: tokens.id },
    });

    return tokens;
  }

  async logout(rawRefreshToken: string | undefined) {
    if (!rawRefreshToken) return;
    const tokenHash = this.hashToken(rawRefreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revogadoEm: null },
      data: { revogadoEm: new Date() },
    });
  }

  async changePassword(userId: string, novaSenha: string) {
    const senhaHash = await bcrypt.hash(novaSenha, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { senhaHash, precisaTrocarSenha: false },
    });
  }
}
