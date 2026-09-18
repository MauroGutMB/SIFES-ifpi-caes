import { Controller, Get, NotFoundException, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ApiExcludeController } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { PrismaService } from '../prisma/prisma.service';

// Único conjunto de mimeTypes que esse endpoint tem confiança pra ecoar como Content-Type real.
// Cobre tudo que os pontos de upload do sistema hoje aceitam (fotos, materiais de aula, entregas,
// anexos de atividade). Qualquer mimeType gravado fora desse allowlist — inclusive dados legados
// gravados antes da validação de upload existir — é servido como download genérico, nunca
// renderizado inline, porque o valor vem de uma coluna preenchida por quem fez o upload.
const MIME_TIPOS_SEGUROS_PARA_INLINE = new Set([
  'image/jpeg',
  'image/png',
  'application/pdf',
]);

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

    // Nunca deixa o navegador "adivinhar" o tipo por conta própria — reforça o Content-Type
    // abaixo mesmo quando ele já é seguro.
    res.set('X-Content-Type-Options', 'nosniff');

    const seguro = MIME_TIPOS_SEGUROS_PARA_INLINE.has(arquivo.mimeType);
    res.set(
      'Content-Type',
      seguro ? arquivo.mimeType : 'application/octet-stream',
    );
    res.set('Content-Disposition', seguro ? 'inline' : 'attachment');
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(Buffer.from(arquivo.conteudo));
  }
}
