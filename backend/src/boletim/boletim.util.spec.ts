import {
  calcularFrequenciaPercentual,
  calcularNotaFinal,
  calcularSituacao,
  ItemParaNotaFinal,
} from './boletim.util';
import { StatusFrequencia } from '../../generated/prisma/client';

/** Item normal — peso nasce 1 (regra real do PlanoDisciplinaService: todo item conta igual
 * até o professor customizar pesos pela regra de aprovação). */
function itemNormal(
  id: string,
  valorMaximo: number,
  valorObtido: number,
  peso = 1,
): ItemParaNotaFinal {
  return {
    id,
    valorMaximo,
    valorObtido,
    peso,
    especial: false,
    modoEspecial: null,
    itemSubstituidoId: null,
    habilitadoParaAluno: false,
  };
}

function itemEspecial(
  overrides: Partial<ItemParaNotaFinal> & { id: string },
): ItemParaNotaFinal {
  return {
    valorMaximo: 10,
    valorObtido: 0,
    peso: 1,
    especial: true,
    modoEspecial: 'PONDERADA',
    itemSubstituidoId: null,
    habilitadoParaAluno: true,
    ...overrides,
  };
}

describe('boletim.util', () => {
  describe('calcularNotaFinal', () => {
    it('item sem nota lançada conta como 0 (não é excluído do denominador)', () => {
      const nota = calcularNotaFinal([
        itemNormal('1', 10, 10),
        itemNormal('2', 10, 0),
        itemNormal('3', 10, 0),
      ]);
      expect(nota).toBeCloseTo(3.33, 2);
    });

    it('normaliza cada item pra escala 0-10 antes de fazer a média (peso 1 = todo item conta igual, mesmo com valorMaximo diferente)', () => {
      const nota = calcularNotaFinal([
        itemNormal('1', 30, 15), // normalizado: 15/30*10 = 5.0
        itemNormal('2', 70, 70), // normalizado: 70/70*10 = 10.0
      ]);
      expect(nota).toBeCloseTo(7.5, 2);
    });

    it('sem nenhum item retorna 0 (evita divisão por zero)', () => {
      expect(calcularNotaFinal([])).toBe(0);
    });

    it('item especial não habilitado pro aluno é ignorado, mesmo com nota lançada', () => {
      const nota = calcularNotaFinal([
        itemNormal('1', 10, 5),
        itemEspecial({ id: 'e1', valorObtido: 10, habilitadoParaAluno: false }),
      ]);
      expect(nota).toBe(5);
    });

    it('item especial sem modoEspecial configurado é ignorado (não vira PONDERADA por acaso)', () => {
      const nota = calcularNotaFinal([
        itemNormal('1', 10, 5),
        itemEspecial({ id: 'e1', modoEspecial: null, valorObtido: 10 }),
      ]);
      expect(nota).toBe(5);
    });

    it('modo PONDERADA: item especial entra como mais um componente da média, com peso próprio', () => {
      const nota = calcularNotaFinal([
        itemNormal('1', 10, 5, 2),
        itemNormal('2', 10, 5, 2),
        itemEspecial({
          id: 'e1',
          modoEspecial: 'PONDERADA',
          peso: 1,
          valorObtido: 10,
        }),
      ]);
      // (5*2 + 5*2 + 10*1) / (2+2+1) = 30/5 = 6
      expect(nota).toBe(6);
    });

    it('modo SUBSTITUI_ITEM: troca o componente do item indicado pelo do especial', () => {
      const nota = calcularNotaFinal([
        itemNormal('1', 10, 5),
        itemNormal('2', 10, 4),
        itemEspecial({
          id: 'e1',
          modoEspecial: 'SUBSTITUI_ITEM',
          itemSubstituidoId: '2',
          peso: 1,
          valorObtido: 8,
        }),
      ]);
      // item 2 (nota 4) sai, entra o especial (nota 8): (5+8)/2 = 6.5
      expect(nota).toBe(6.5);
    });

    it('modo SUBSTITUI_MEDIA: nota final vira a nota normalizada do item especial', () => {
      const nota = calcularNotaFinal([
        itemNormal('1', 10, 2),
        itemNormal('2', 10, 3),
        itemEspecial({
          id: 'e1',
          modoEspecial: 'SUBSTITUI_MEDIA',
          valorObtido: 9,
        }),
      ]);
      expect(nota).toBe(9);
    });

    it('item especial abaixo da nota mínima de aprovação da disciplina é ignorado', () => {
      const nota = calcularNotaFinal(
        [
          itemNormal('1', 10, 5),
          itemEspecial({
            id: 'e1',
            modoEspecial: 'SUBSTITUI_MEDIA',
            valorObtido: 5, // normalizado = 5, abaixo da nota mínima (6)
          }),
        ],
        6,
      );
      expect(nota).toBe(5); // ignora o especial, fica só a média normal
    });

    it('item especial que atinge a nota mínima de aprovação da disciplina é considerado', () => {
      const nota = calcularNotaFinal(
        [
          itemNormal('1', 10, 5),
          itemEspecial({
            id: 'e1',
            modoEspecial: 'SUBSTITUI_MEDIA',
            valorObtido: 6,
          }),
        ],
        6,
      );
      expect(nota).toBe(6);
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
