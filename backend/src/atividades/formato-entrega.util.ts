import { FormatoArquivo } from '../../generated/prisma/client';

export const MAX_ENTREGA_BYTES = 20 * 1024 * 1024; // 20MB

const MIME_REGEX_POR_FORMATO: Record<FormatoArquivo, RegExp> = {
  [FormatoArquivo.PDF]: /^application\/pdf$/,
  [FormatoArquivo.WORD]:
    /^application\/(msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document)$/,
  [FormatoArquivo.FOTO]: /^image\/(jpeg|png)$/,
};

export function mimeRegexParaFormato(formato: FormatoArquivo): RegExp {
  return MIME_REGEX_POR_FORMATO[formato];
}
