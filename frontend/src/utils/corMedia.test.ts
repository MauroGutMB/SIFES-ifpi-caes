import { corMedia } from './corMedia';
import { tokens } from '../theme/tokens';

describe('corMedia', () => {
  it('retorna azul quando a nota ainda é parcial, independente do valor', () => {
    expect(corMedia(9, true, 6)).toBe(tokens.blueText);
    expect(corMedia(0, true, 6)).toBe(tokens.blueText);
  });

  it('retorna verde quando a média final é maior ou igual à nota mínima', () => {
    expect(corMedia(6, false, 6)).toBe(tokens.green);
    expect(corMedia(8, false, 6)).toBe(tokens.green);
  });

  it('retorna vermelho quando a média final fica abaixo da nota mínima', () => {
    expect(corMedia(5.9, false, 6)).toBe(tokens.redText);
  });
});
