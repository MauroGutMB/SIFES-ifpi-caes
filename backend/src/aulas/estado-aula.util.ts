import { AulaEstadoOverride } from '../../generated/prisma/client';

export type EstadoAula = 'LANCADO' | 'NAO_LANCADO';

interface AulaComoEdicao {
  estadoOverride: AulaEstadoOverride | null;
  titulo: string | null;
  descricao: string | null;
  temFrequencias: boolean;
}

/**
 * Estado lançado/não lançado: reflete se a Aula já sofreu alguma edição do professor —
 * título/descrição preenchidos (mesmo em branco, o que importa é o "Salvar" ter sido usado)
 * ou frequência já registrada — a menos que o admin tenha sobreposto manualmente. Não bloqueia
 * edição em nenhum dos dois estados — ver `podeEditarAula`.
 */
export function calcularEstadoAula(aula: AulaComoEdicao): EstadoAula {
  if (aula.estadoOverride) {
    return aula.estadoOverride;
  }
  const foiEditada =
    aula.titulo !== null || aula.descricao !== null || aula.temFrequencias;
  return foiEditada ? 'LANCADO' : 'NAO_LANCADO';
}
