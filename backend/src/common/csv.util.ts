/** Parser mínimo de CSV — só precisa lidar com campos entre aspas (nomes/valores que
 * contenham vírgula), sem puxar uma dependência inteira pra um caso tão controlado. */
function parseLinhaCsv(linha: string): string[] {
  const campos: string[] = [];
  let atual = '';
  let dentroDeAspas = false;

  for (let i = 0; i < linha.length; i++) {
    const char = linha[i];
    if (dentroDeAspas) {
      if (char === '"') {
        if (linha[i + 1] === '"') {
          atual += '"';
          i++;
        } else {
          dentroDeAspas = false;
        }
      } else {
        atual += char;
      }
    } else if (char === '"') {
      dentroDeAspas = true;
    } else if (char === ',') {
      campos.push(atual);
      atual = '';
    } else {
      atual += char;
    }
  }
  campos.push(atual);
  return campos.map((c) => c.trim());
}

/** Ignora linhas em branco (incluindo uma linha final vazia, comum em arquivos exportados
 * do Excel/Sheets). */
export function parseCsv(conteudo: string): string[][] {
  return conteudo
    .split(/\r\n|\n/)
    .filter((linha) => linha.trim().length > 0)
    .map(parseLinhaCsv);
}
