import { DiaSemana, Turno } from '../../generated/prisma/client';

/** Mapeia o enum DiaSemana para o índice usado por Date.getDay() (0=domingo). */
const JS_DAY_BY_DIA_SEMANA: Record<DiaSemana, number> = {
  [DiaSemana.SEGUNDA]: 1,
  [DiaSemana.TERCA]: 2,
  [DiaSemana.QUARTA]: 3,
  [DiaSemana.QUINTA]: 4,
  [DiaSemana.SEXTA]: 5,
  [DiaSemana.SABADO]: 6,
};

// Janela geral de aulas: 7h–18h. Turno divide essa janela ao meio-dia.
const JANELA_MINUTOS = { inicio: 7 * 60, fim: 18 * 60 };
const JANELA_POR_TURNO: Record<Turno, { inicio: number; fim: number }> = {
  [Turno.MANHA]: { inicio: 7 * 60, fim: 12 * 60 },
  [Turno.TARDE]: { inicio: 12 * 60, fim: 18 * 60 },
};

const DURACAO_AULA_MINUTOS = 60;

export function parseHoraMinuto(hora: string): number {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(hora);
  if (!match) {
    throw new Error('Horário inválido, use o formato HH:mm');
  }
  return Number(match[1]) * 60 + Number(match[2]);
}

/** Valida que o horário (HH:mm) cabe na janela 7h–18h e dentro do turno da turma. */
export function validarHorarioNoTurno(
  hora: string,
  turno: Turno,
): string | null {
  const minutos = parseHoraMinuto(hora);
  const fimAula = minutos + DURACAO_AULA_MINUTOS;

  if (minutos < JANELA_MINUTOS.inicio || fimAula > JANELA_MINUTOS.fim) {
    return 'Horário deve estar dentro da janela 7h–18h (considerando 1h de duração)';
  }

  const janelaTurno = JANELA_POR_TURNO[turno];
  if (minutos < janelaTurno.inicio || fimAula > janelaTurno.fim) {
    return `Horário deve respeitar o turno da turma (${turno === Turno.MANHA ? '7h–12h' : '12h–18h'})`;
  }

  return null;
}

function combinarDataHora(data: Date, minutosDoDia: number): Date {
  const resultado = new Date(data);
  resultado.setHours(Math.floor(minutosDoDia / 60), minutosDoDia % 60, 0, 0);
  return resultado;
}

/** Gera uma ocorrência de Aula (data + horaInicio + horaFim) para cada dia da semana configurado, dentro do intervalo do Semestre. */
export function gerarOcorrenciasAula(
  dataInicioSemestre: Date,
  dataFimSemestre: Date,
  diaSemana: DiaSemana,
  horaInicioStr: string,
): { data: Date; horaInicio: Date; horaFim: Date }[] {
  const diaAlvo = JS_DAY_BY_DIA_SEMANA[diaSemana];
  const minutosInicio = parseHoraMinuto(horaInicioStr);
  const ocorrencias: { data: Date; horaInicio: Date; horaFim: Date }[] = [];

  const cursor = new Date(dataInicioSemestre);
  cursor.setHours(0, 0, 0, 0);
  const fim = new Date(dataFimSemestre);
  fim.setHours(0, 0, 0, 0);

  while (cursor <= fim) {
    if (cursor.getDay() === diaAlvo) {
      const dataAula = new Date(cursor);
      ocorrencias.push({
        data: dataAula,
        horaInicio: combinarDataHora(dataAula, minutosInicio),
        horaFim: combinarDataHora(
          dataAula,
          minutosInicio + DURACAO_AULA_MINUTOS,
        ),
      });
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return ocorrencias;
}
