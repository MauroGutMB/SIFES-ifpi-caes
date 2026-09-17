import { AulaEstadoOverride } from '../../generated/prisma/client';

export type EstadoAula = 'LANCADO' | 'NAO_LANCADO';

interface AulaComoFrequencia {
  estadoOverride: AulaEstadoOverride | null;
  temFrequencias: boolean;
}

/**
 * Estado lançado/não lançado: reflete se a Aula já tem frequência registrada, a menos que
 * o admin tenha sobreposto manualmente. Não bloqueia mais edição — ver `podeEditarAula`.
 */
export function calcularEstadoAula(aula: AulaComoFrequencia): EstadoAula {
  if (aula.estadoOverride) {
    return aula.estadoOverride;
  }
  return aula.temFrequencias ? 'LANCADO' : 'NAO_LANCADO';
}
