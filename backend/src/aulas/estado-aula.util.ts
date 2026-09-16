import { AulaEstadoOverride } from '../../generated/prisma/client';
import { agoraComoBrasiliaFake } from '../common/tempo.util';

export type EstadoAula = 'LANCADO' | 'NAO_LANCADO';

interface AulaComoHorario {
  horaInicio: Date;
  horaFim: Date;
  estadoOverride: AulaEstadoOverride | null;
}

/**
 * Estado lançado/não lançado: automático pela janela [horaInicio, horaFim), a menos que o
 * admin tenha sobreposto manualmente (ver regras-negocio.md — Janela de lançamento e estado da Aula).
 */
export function calcularEstadoAula(aula: AulaComoHorario): EstadoAula {
  if (aula.estadoOverride) {
    return aula.estadoOverride;
  }
  const agora = agoraComoBrasiliaFake();
  return agora >= aula.horaInicio && agora < aula.horaFim
    ? 'LANCADO'
    : 'NAO_LANCADO';
}
