import { Controller, Get, NotFoundException, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ApiExcludeController } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';

/** Serve o conteúdo binário de qualquer upload gravado na tabela `arquivos` — substitui o antigo
 * `useStaticAssets('/uploads')`, que dependia de disco local (efêmero em produção). Público, sem
 * autenticação, para preservar o mesmo comportamento de acesso que os arquivos estáticos tinham
 * (fotos de perfil e materiais já eram acessíveis por URL direta, sem checagem de posse). */
@ApiExcludeController()
@Controller('arquivos')
export class ArquivosController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get(':id')
  async servir(@Param('id') id: string, @Res() res: Response) {
    const arquivo = await this.prisma.arquivo.findUnique({ where: { id } });
    if (!arquivo) {
      throw new NotFoundException('Arquivo não encontrado');
    }
    res.set('Content-Type', arquivo.mimeType);
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(Buffer.from(arquivo.conteudo));
  }
}
