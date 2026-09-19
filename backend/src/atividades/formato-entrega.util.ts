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

// Todos os mimeTypes aceitos pelo sistema, independente de formato — usado pro anexo do
// professor (enunciado/material), que pode ser qualquer um deles, ao contrário da entrega do
// aluno, que é restrita ao formatoExigido daquela Atividade.
export function mimeTiposTodosFormatos(): string[] {
  return Object.values(FormatoArquivo).flatMap(
    (formato) => MIME_TIPOS_POR_FORMATO[formato],
  );
}

export function mimeRegexTodosFormatos(): RegExp {
  const alternativas = mimeTiposTodosFormatos()
    .map((mime) => mime.replace(/[.+]/g, '\\$&'))
    .join('|');
  return new RegExp(`^(${alternativas})$`);
}
