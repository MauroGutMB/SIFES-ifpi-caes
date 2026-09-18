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
 * do Excel/Sheets). Remove o BOM UTF-8 se presente — o Excel adiciona um ao salvar
 * CSV como "UTF-8", e sem removê-lo ele gruda no primeiro campo do cabeçalho. */
export function parseCsv(conteudo: string): string[][] {
  const semBom =
    conteudo.charCodeAt(0) === 0xfeff ? conteudo.slice(1) : conteudo;
  return semBom
    .split(/\r\n|\n/)
    .filter((linha) => linha.trim().length > 0)
    .map(parseLinhaCsv);
}
