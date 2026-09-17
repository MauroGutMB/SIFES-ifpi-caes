import { calcularEstadoAula } from './estado-aula.util';

describe('calcularEstadoAula', () => {
  const nuncaEditada = {
    estadoOverride: null,
    titulo: null,
    descricao: null,
    temFrequencias: false,
  };

  it('é NAO_LANCADO quando nunca foi editada e não tem frequência', () => {
    expect(calcularEstadoAula(nuncaEditada)).toBe('NAO_LANCADO');
  });

  it('é LANCADO assim que o título é definido, mesmo em branco', () => {
    expect(calcularEstadoAula({ ...nuncaEditada, titulo: '' })).toBe('LANCADO');
  });

  it('é LANCADO assim que a descrição é definida, mesmo em branco', () => {
    expect(calcularEstadoAula({ ...nuncaEditada, descricao: '' })).toBe(
      'LANCADO',
    );
  });

  it('é LANCADO quando já existe frequência registrada, mesmo sem editar título/descrição', () => {
    expect(calcularEstadoAula({ ...nuncaEditada, temFrequencias: true })).toBe(
      'LANCADO',
    );
  });

  it('override do admin vence o cálculo automático nos dois sentidos', () => {
    expect(
      calcularEstadoAula({ ...nuncaEditada, estadoOverride: 'LANCADO' }),
    ).toBe('LANCADO');
    expect(
      calcularEstadoAula({
        ...nuncaEditada,
        titulo: 'Aula editada',
        temFrequencias: true,
        estadoOverride: 'NAO_LANCADO',
      }),
    ).toBe('NAO_LANCADO');
  });
});
