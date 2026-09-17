export const DIAS_SEMANA = [
  { value: 'SEGUNDA', label: 'Segunda' },
  { value: 'TERCA', label: 'Terça' },
  { value: 'QUARTA', label: 'Quarta' },
  { value: 'QUINTA', label: 'Quinta' },
  { value: 'SEXTA', label: 'Sexta' },
  { value: 'SABADO', label: 'Sábado' },
] as const;

export function labelDiaSemana(valor: string): string {
  return DIAS_SEMANA.find((d) => d.value === valor)?.label ?? valor;
}

interface HorarioResumo {
  diaSemana: string;
  horaInicio: string;
}

/** Resume uma lista de horários semanais num texto curto, ex: "Seg 08:00, Qui 08:00". */
export function resumoHorarios(horarios: HorarioResumo[]): string {
  if (!horarios.length) return '—';
  return horarios
    .map((h) => `${labelDiaSemana(h.diaSemana).slice(0, 3)} ${h.horaInicio}`)
    .join(', ');
}
