import {
  calcularFrequenciaPercentual,
  calcularNotaFinal,
  calcularSituacao,
} from './boletim.util';
import { StatusFrequencia } from '../../generated/prisma/client';

describe('boletim.util', () => {
  describe('calcularNotaFinal', () => {
    it('item sem nota lançada conta como 0 (não é excluído do denominador)', () => {
      const nota = calcularNotaFinal([
        { valorMaximo: 10, valorObtido: 10 },
        { valorMaximo: 10, valorObtido: 0 },
        { valorMaximo: 10, valorObtido: 0 },
      ]);
      expect(nota).toBeCloseTo(3.33, 2);
    });

    it('normaliza pra escala 0-10 mesmo com itens que não somam 10', () => {
      const nota = calcularNotaFinal([
        { valorMaximo: 30, valorObtido: 15 },
        { valorMaximo: 70, valorObtido: 70 },
      ]);
      // (15+70)/(30+70) * 10 = 8.5
      expect(nota).toBeCloseTo(8.5, 2);
    });

    it('sem nenhum item retorna 0 (evita divisão por zero)', () => {
      expect(calcularNotaFinal([])).toBe(0);
    });
  });

  describe('calcularFrequenciaPercentual', () => {
    it('falta justificada não entra no denominador', () => {
      const percentual = calcularFrequenciaPercentual([
        { status: StatusFrequencia.PRESENTE },
        { status: StatusFrequencia.PRESENTE },
        { status: StatusFrequencia.FALTA },
        { status: StatusFrequencia.FALTA_JUSTIFICADA },
      ]);
      // 2 presentes / 3 consideradas (exclui a justificada) = 66.67%
      expect(percentual).toBeCloseTo(66.67, 1);
    });

    it('sem nenhuma aula lançada ainda, retorna 100%', () => {
      expect(calcularFrequenciaPercentual([])).toBe(100);
    });

    it('todas justificadas também retorna 100% (denominador zero)', () => {
      const percentual = calcularFrequenciaPercentual([
        { status: StatusFrequencia.FALTA_JUSTIFICADA },
      ]);
      expect(percentual).toBe(100);
    });
  });

  describe('calcularSituacao', () => {
    it('enquanto a matéria está aberta, é sempre CURSANDO independente da nota/frequência', () => {
      expect(calcularSituacao(true, 0, 0)).toBe('CURSANDO');
      expect(calcularSituacao(true, 10, 100)).toBe('CURSANDO');
    });

    it('encerrada com nota >= 7 e frequência >= 75% é APROVADO', () => {
      expect(calcularSituacao(false, 7, 75)).toBe('APROVADO');
      expect(calcularSituacao(false, 9, 100)).toBe('APROVADO');
    });

    it('encerrada com nota abaixo de 7 é REPROVADO mesmo com frequência ok', () => {
      expect(calcularSituacao(false, 6.99, 100)).toBe('REPROVADO');
    });

    it('encerrada com frequência abaixo de 75% é REPROVADO mesmo com nota ok', () => {
      expect(calcularSituacao(false, 10, 74.99)).toBe('REPROVADO');
    });
  });
});
