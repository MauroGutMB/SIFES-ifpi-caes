import { parseCsv } from './csv.util';

describe('parseCsv', () => {
  it('separa colunas simples por vírgula', () => {
    expect(parseCsv('nome,login,cargo\nMaria,12345678,ALUNO')).toEqual([
      ['nome', 'login', 'cargo'],
      ['Maria', '12345678', 'ALUNO'],
    ]);
  });

  it('lida com campo entre aspas contendo vírgula', () => {
    expect(parseCsv('nome,login,cargo\n"Silva, Maria",12345678,ALUNO')).toEqual(
      [
        ['nome', 'login', 'cargo'],
        ['Silva, Maria', '12345678', 'ALUNO'],
      ],
    );
  });

  it('ignora linhas em branco (ex: linha final vazia de export do Excel)', () => {
    expect(parseCsv('nome,login,cargo\nMaria,123,ALUNO\n\n')).toEqual([
      ['nome', 'login', 'cargo'],
      ['Maria', '123', 'ALUNO'],
    ]);
  });

  it('remove espaços em volta de cada campo', () => {
    expect(parseCsv('nome, login , cargo\n Maria , 123 , ALUNO ')).toEqual([
      ['nome', 'login', 'cargo'],
      ['Maria', '123', 'ALUNO'],
    ]);
  });
});
