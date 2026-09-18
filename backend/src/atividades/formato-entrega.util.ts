import { FormatoArquivo } from '../../generated/prisma/client';

export const MAX_ENTREGA_BYTES = 20 * 1024 * 1024; // 20MB

// Fonte única de verdade dos mimeTypes aceitos por formato — usada tanto para montar o regex de
// validação do header Content-Type quanto para a checagem de magic bytes do conteúdo real.
const MIME_TIPOS_POR_FORMATO: Record<FormatoArquivo, string[]> = {
  [FormatoArquivo.PDF]: ['application/pdf'],
  [FormatoArquivo.WORD]: [
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  [FormatoArquivo.FOTO]: ['image/jpeg', 'image/png'],
};

export function mimeTiposParaFormato(formato: FormatoArquivo): string[] {
  return MIME_TIPOS_POR_FORMATO[formato];
}

export function mimeRegexParaFormato(formato: FormatoArquivo): RegExp {
  const alternativas = MIME_TIPOS_POR_FORMATO[formato]
    .map((mime) => mime.replace(/[.+]/g, '\\$&'))
    .join('|');
  return new RegExp(`^(${alternativas})$`);
}
