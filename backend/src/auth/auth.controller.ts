import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { RefreshResponseDto } from './dto/refresh-response.dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import type { AuthenticatedUser } from './auth.types';

const REFRESH_COOKIE = 'refresh_token';
const REFRESH_COOKIE_PATH = '/auth';

function getRefreshCookie(req: Request): string | undefined {
  const cookies = req.cookies as Record<string, string> | undefined;
  return cookies?.[REFRESH_COOKIE];
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  private setRefreshCookie(res: Response, token: string, expiresAt: Date) {
    const secure = this.config.get('COOKIE_SECURE') === 'true';
    res.cookie(REFRESH_COOKIE, token, {
      httpOnly: true,
      secure,
      // 'strict'/'lax' nunca são enviados em requisição cross-site — necessário aqui porque
      // frontend e backend costumam ficar em domínios diferentes em produção.
      // 'none' exige secure:true, por isso só liga quando COOKIE_SECURE=true.
      sameSite: secure ? 'none' : 'lax',
      path: REFRESH_COOKIE_PATH,
      expires: expiresAt,
    });
  }

  // 30 tentativas/min por IP — abaixo do default de 100/min (login é o alvo de
  // brute-force óbvio, já que a matrícula do aluno é previsível: 8 dígitos), mas alto o
  // suficiente pra não travar uma sala de aula inteira atrás do mesmo IP/NAT.
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: LoginResponseDto })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResponseDto> {
    const {
      accessToken,
      refreshToken,
      refreshExpiresAt,
      role,
      precisaTrocarSenha,
    } = await this.authService.login(dto.login, dto.senha);
    this.setRefreshCookie(res, refreshToken, refreshExpiresAt);
    return { accessToken, role, precisaTrocarSenha };
  }

  // Mesmo limite do login (não é alvo direto de brute-force — precisa de um refresh token
  // válido), mas ainda limitado porque também é @Public() e aceita qualquer token opaco.
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: RefreshResponseDto })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<RefreshResponseDto> {
    const rawToken = getRefreshCookie(req);
    const { accessToken, refreshToken, refreshExpiresAt } =
      await this.authService.refresh(rawToken);
    this.setRefreshCookie(res, refreshToken, refreshExpiresAt);
    return { accessToken };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const rawToken = getRefreshCookie(req);
    await this.authService.logout(rawToken);
    res.clearCookie(REFRESH_COOKIE, { path: REFRESH_COOKIE_PATH });
  }

  @Post('change-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
  ) {
    await this.authService.changePassword(user.id, dto.novaSenha);
  }
}
