import { formatarDataCivil, formatarHoraCivil } from './data';

describe('formatarDataCivil', () => {
  it('mostra o dia guardado, sem recuar um dia pelo fuso do navegador', () => {
    expect(formatarDataCivil('2026-02-02T00:00:00.000Z')).toBe('02/02/2026');
    expect(formatarDataCivil('2026-02-01T00:00:00.000Z')).toBe('01/02/2026');
    expect(formatarDataCivil('2026-12-31T00:00:00.000Z')).toBe('31/12/2026');
  });
});

describe('formatarHoraCivil', () => {
  it('mostra a hora guardada, inclusive horários quebrados', () => {
    expect(formatarHoraCivil('2026-02-02T08:30:00.000Z')).toBe('08:30');
    expect(formatarHoraCivil('2026-02-02T17:00:00.000Z')).toBe('17:00');
  });
});
