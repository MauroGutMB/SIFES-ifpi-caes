import {
  gerarOcorrenciasAula,
  parseHoraMinuto,
  encontrarSobreposicao,
  horariosSeSobrepoem,
  rotuloHorario,
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
    it('aceita horários dentro da janela 7h–18h (considerando 1h de duração)', () => {
      expect(validarHorario('07:00')).toBeNull();
      expect(validarHorario('17:00')).toBeNull();
      expect(validarHorario('12:00')).toBeNull();
    });

    it('aceita hora quebrada (ex.: 08:30), respeitando a janela', () => {
      expect(validarHorario('08:30')).toBeNull();
      expect(validarHorario('17:00')).toBeNull();
      expect(validarHorario('17:30')).not.toBeNull();
      expect(validarHorario('06:59')).not.toBeNull();
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

  describe('horariosSeSobrepoem', () => {
    it('detecta sobreposição de aulas de 1h', () => {
      expect(horariosSeSobrepoem('08:00', '08:00')).toBe(true);
      expect(horariosSeSobrepoem('08:00', '08:30')).toBe(true);
      expect(horariosSeSobrepoem('08:30', '08:00')).toBe(true);
      expect(horariosSeSobrepoem('08:00', '09:00')).toBe(false);
      expect(horariosSeSobrepoem('08:00', '09:30')).toBe(false);
    });
  });

  describe('encontrarSobreposicao', () => {
    it('acha slots da mesma matéria que se cruzam no mesmo dia', () => {
      const a = { diaSemana: DiaSemana.SEGUNDA, horaInicio: '08:00' };
      const b = { diaSemana: DiaSemana.SEGUNDA, horaInicio: '08:30' };
      expect(encontrarSobreposicao([a, b])).toEqual([a, b]);
    });

    it('não acusa dias diferentes nem aulas encostadas (08:00 e 09:00)', () => {
      expect(
        encontrarSobreposicao([
          { diaSemana: DiaSemana.SEGUNDA, horaInicio: '08:00' },
          { diaSemana: DiaSemana.TERCA, horaInicio: '08:30' },
          { diaSemana: DiaSemana.SEGUNDA, horaInicio: '09:00' },
        ]),
      ).toBeNull();
    });
  });

  describe('rotuloHorario', () => {
    it('hora cheia vira "08h" e horário quebrado mantém os minutos', () => {
      expect(rotuloHorario('08:00')).toBe('08h');
      expect(rotuloHorario('08:30')).toBe('08:30');
      expect(rotuloHorario('17:05')).toBe('17:05');
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
