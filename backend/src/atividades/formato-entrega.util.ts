import { FormatoArquivo } from '../../generated/prisma/client';

export const MAX_ENTREGA_BYTES = 20 * 1024 * 1024; // 20MB

const MIME_REGEX_POR_FORMATO: Record<FormatoArquivo, RegExp> = {
  [FormatoArquivo.PDF]: /^application\/pdf$/,
  [FormatoArquivo.WORD]:
    /^application\/(msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document)$/,
  [FormatoArquivo.FOTO]: /^image\/(jpeg|png)$/,
};

const EXT_POR_MIME: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    'docx',
  'image/jpeg': 'jpg',
  'image/png': 'png',
};

export function mimeRegexParaFormato(formato: FormatoArquivo): RegExp {
  return MIME_REGEX_POR_FORMATO[formato];
}

export function extensaoPorMime(mime: string): string {
  return EXT_POR_MIME[mime] ?? 'bin';
}
