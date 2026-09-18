import {
  gerarOcorrenciasAula,
  parseHoraMinuto,
  validarHorario,
} from './horario.util';
import { DiaSemana } from '../../generated/prisma/client';

describe('horario.util', () => {
  describe('parseHoraMinuto', () => {
    it('converte HH:mm em minutos do dia', () => {
      expect(parseHoraMinuto('08:00')).toBe(480);
      expect(parseHoraMinuto('00:00')).toBe(0);
      expect(parseHoraMinuto('23:59')).toBe(1439);
    });

    it('rejeita formato inválido', () => {
      expect(() => parseHoraMinuto('25:00')).toThrow();
      expect(() => parseHoraMinuto('8:00')).toThrow();
      expect(() => parseHoraMinuto('abc')).toThrow();
    });
  });

  describe('validarHorario', () => {
    it('aceita horários em hora cheia dentro da janela 7h–18h (considerando 1h de duração)', () => {
      expect(validarHorario('07:00')).toBeNull();
      expect(validarHorario('17:00')).toBeNull();
      expect(validarHorario('12:00')).toBeNull();
    });

    it('rejeita hora quebrada — aulas só começam em hora cheia', () => {
      expect(validarHorario('12:30')).not.toBeNull();
      expect(validarHorario('08:15')).not.toBeNull();
    });

    it('rejeita horário antes das 7h', () => {
      expect(validarHorario('06:00')).not.toBeNull();
    });

    it('rejeita horário que ultrapassaria as 18h (ex.: 18:00 -> terminaria 19:00)', () => {
      expect(validarHorario('18:00')).not.toBeNull();
    });

    it('não restringe mais por turno (matéria pode estar em contraturno)', () => {
      // 14h é válido mesmo que a turma seja de manhã — a restrição de turno foi removida.
      expect(validarHorario('14:00')).toBeNull();
    });
  });

  describe('gerarOcorrenciasAula', () => {
    it('gera uma ocorrência por semana no dia configurado, dentro do intervalo do semestre', () => {
      // Fevereiro/2027 inteiro, com 4 segundas-feiras (01, 08, 15, 22).
      const ocorrencias = gerarOcorrenciasAula(
        new Date('2027-02-01T00:00:00.000Z'),
        new Date('2027-02-28T00:00:00.000Z'),
        DiaSemana.SEGUNDA,
        '08:00',
      );
      expect(ocorrencias).toHaveLength(4);
      expect(ocorrencias.map((o) => o.data.toISOString().slice(0, 10))).toEqual(
        ['2027-02-01', '2027-02-08', '2027-02-15', '2027-02-22'],
      );
    });

    it('horaInicio/horaFim têm 1h de duração, na mesma data da ocorrência', () => {
      const [ocorrencia] = gerarOcorrenciasAula(
        new Date('2027-02-01T00:00:00.000Z'),
        new Date('2027-02-01T00:00:00.000Z'),
        DiaSemana.SEGUNDA,
        '08:00',
      );
      expect(ocorrencia.horaInicio.toISOString()).toBe(
        '2027-02-01T08:00:00.000Z',
      );
      expect(ocorrencia.horaFim.toISOString()).toBe('2027-02-01T09:00:00.000Z');
    });

    it('não gera nenhuma ocorrência se o dia da semana não cair no intervalo', () => {
      // Um único dia (segunda), pedindo terça — não deve gerar nada.
      const ocorrencias = gerarOcorrenciasAula(
        new Date('2027-02-01T00:00:00.000Z'),
        new Date('2027-02-01T00:00:00.000Z'),
        DiaSemana.TERCA,
        '08:00',
      );
      expect(ocorrencias).toHaveLength(0);
    });

    it('regressão: não gera aula um dia antes do início do semestre (bug de fuso corrigido)', () => {
      // dataInicio já é uma segunda-feira (2027-02-01) — não pode aparecer 2027-01-31.
      const ocorrencias = gerarOcorrenciasAula(
        new Date('2027-02-01T00:00:00.000Z'),
        new Date('2027-02-01T00:00:00.000Z'),
        DiaSemana.SEGUNDA,
        '08:00',
      );
      const datas = ocorrencias.map((o) => o.data.toISOString().slice(0, 10));
      expect(datas).not.toContain('2027-01-31');
      expect(datas).toEqual(['2027-02-01']);
    });
  });
});
