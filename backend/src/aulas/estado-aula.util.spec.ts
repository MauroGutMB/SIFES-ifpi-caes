import { calcularEstadoAula } from './estado-aula.util';

describe('calcularEstadoAula', () => {
  const aula = {
    horaInicio: new Date('2026-09-16T08:00:00.000Z'),
    horaFim: new Date('2026-09-16T09:00:00.000Z'),
    estadoOverride: null,
  };

  it('é NAO_LANCADO antes do horário de início', () => {
    const agora = new Date('2026-09-16T07:59:59.000Z');
    expect(calcularEstadoAula(aula, agora)).toBe('NAO_LANCADO');
  });

  it('é LANCADO exatamente no horário de início', () => {
    const agora = new Date('2026-09-16T08:00:00.000Z');
    expect(calcularEstadoAula(aula, agora)).toBe('LANCADO');
  });

  it('é LANCADO um instante antes do fim da janela de 1h', () => {
    const agora = new Date('2026-09-16T08:59:59.000Z');
    expect(calcularEstadoAula(aula, agora)).toBe('LANCADO');
  });

  it('volta a NAO_LANCADO exatamente no horário de fim (janela é [inicio, fim))', () => {
    const agora = new Date('2026-09-16T09:00:00.000Z');
    expect(calcularEstadoAula(aula, agora)).toBe('NAO_LANCADO');
  });

  it('override do admin vence o cálculo automático, mesmo fora da janela', () => {
    const foraDaJanela = new Date('2026-09-16T20:00:00.000Z');
    expect(
      calcularEstadoAula({ ...aula, estadoOverride: 'LANCADO' }, foraDaJanela),
    ).toBe('LANCADO');
    expect(
      calcularEstadoAula(
        { ...aula, estadoOverride: 'NAO_LANCADO' },
        aula.horaInicio,
      ),
    ).toBe('NAO_LANCADO');
  });
});
