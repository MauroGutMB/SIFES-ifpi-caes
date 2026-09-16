import { DiaSemana } from '../../generated/prisma/client';

/**
 * Todas as datas/horários deste módulo são manipulados em UTC (getUTCDay, setUTCHours etc.),
 * tratando o valor UTC como se já fosse a hora de Brasília — convenção única, sem depender do
 * fuso horário do processo Node. Nunca usar os métodos locais (getDay, setHours...) aqui: eles
 * dependem do fuso do servidor e já causaram um bug real de desalinhamento de datas.
 */

/** Mapeia o enum DiaSemana para o índice usado por Date.getUTCDay() (0=domingo). */
const JS_DAY_BY_DIA_SEMANA: Record<DiaSemana, number> = {
  [DiaSemana.SEGUNDA]: 1,
  [DiaSemana.TERCA]: 2,
  [DiaSemana.QUARTA]: 3,
  [DiaSemana.QUINTA]: 4,
  [DiaSemana.SEXTA]: 5,
  [DiaSemana.SABADO]: 6,
};

// Janela geral de aulas: 7h–18h. O turno da Turma é só a designação principal dela — Matérias
// podem ser oferecidas em contraturno, então não há restrição de turno aqui, só a janela geral.
const JANELA_MINUTOS = { inicio: 7 * 60, fim: 18 * 60 };

const DURACAO_AULA_MINUTOS = 60;

export function parseHoraMinuto(hora: string): number {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(hora);
  if (!match) {
    throw new Error('Horário inválido, use o formato HH:mm');
  }
  return Number(match[1]) * 60 + Number(match[2]);
}

/** Valida que o horário (HH:mm) cabe na janela geral 7h–18h (considerando 1h de duração). */
export function validarHorario(hora: string): string | null {
  const minutos = parseHoraMinuto(hora);
  const fimAula = minutos + DURACAO_AULA_MINUTOS;

  if (minutos < JANELA_MINUTOS.inicio || fimAula > JANELA_MINUTOS.fim) {
    return 'Horário deve estar dentro da janela 7h–18h (considerando 1h de duração)';
  }

  return null;
}

function combinarDataHora(data: Date, minutosDoDia: number): Date {
  const resultado = new Date(data);
  resultado.setUTCHours(Math.floor(minutosDoDia / 60), minutosDoDia % 60, 0, 0);
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
  cursor.setUTCHours(0, 0, 0, 0);
  const fim = new Date(dataFimSemestre);
  fim.setUTCHours(0, 0, 0, 0);

  while (cursor <= fim) {
    if (cursor.getUTCDay() === diaAlvo) {
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
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return ocorrencias;
}
