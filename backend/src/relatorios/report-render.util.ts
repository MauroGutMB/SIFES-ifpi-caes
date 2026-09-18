import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';
import { join } from 'path';

export type Formato = 'pdf' | 'xlsx';

export interface TabelaRelatorio {
  titulo: string;
  colunas: string[];
  linhas: (string | number)[][];
}

const ASSETS_DIR = join(process.cwd(), 'assets/relatorio');
const LOGO_SIFES = join(ASSETS_DIR, 'sifes-icone.png');
const LOGO_IF = join(ASSETS_DIR, 'if-logo.png');

/** Timbre institucional no topo de todo relatório PDF: logo do SIFES à esquerda, logo do
 * Instituto Federal do Piauí à direita, com uma linha divisória abaixo. */
function desenharCabecalho(doc: PDFKit.PDFDocument) {
  const inicioX = doc.page.margins.left;
  const larguraUtil =
    doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const alturaLogo = 32;
  const y = doc.y;

  doc.image(LOGO_SIFES, inicioX, y, { height: alturaLogo });

  const larguraLogoIf = alturaLogo * (712 / 200);
  doc.image(LOGO_IF, inicioX + larguraUtil - larguraLogoIf, y, {
    height: alturaLogo,
  });

  doc.y = y + alturaLogo + 8;
  doc
    .moveTo(inicioX, doc.y)
    .lineTo(inicioX + larguraUtil, doc.y)
    .stroke();
  doc.moveDown(0.8);
}

export function mimeParaFormato(formato: Formato): string {
  return formato === 'pdf'
    ? 'application/pdf'
    : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
}

export function extensaoParaFormato(formato: Formato): string {
  return formato === 'pdf' ? 'pdf' : 'xlsx';
}

export function gerarPdfTabela({
  titulo,
  colunas,
  linhas,
}: TabelaRelatorio): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      margin: 40,
      size: 'A4',
      layout: 'landscape',
    });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    desenharCabecalho(doc);

    doc.fontSize(16).text(titulo, { align: 'left' });
    doc.moveDown();

    const larguraUtil =
      doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const larguraColuna = larguraUtil / colunas.length;
    const inicioX = doc.page.margins.left;

    const desenharLinha = (valores: (string | number)[], negrito: boolean) => {
      const y = doc.y;
      doc.font(negrito ? 'Helvetica-Bold' : 'Helvetica').fontSize(9);
      valores.forEach((valor, i) => {
        doc.text(String(valor), inicioX + i * larguraColuna, y, {
          width: larguraColuna - 4,
        });
      });
      doc.moveDown(0.6);
    };

    desenharLinha(colunas, true);
    doc
      .moveTo(inicioX, doc.y)
      .lineTo(inicioX + larguraUtil, doc.y)
      .stroke();
    doc.moveDown(0.3);

    for (const linha of linhas) {
      if (doc.y > doc.page.height - doc.page.margins.bottom - 20) {
        doc.addPage();
        desenharCabecalho(doc);
      }
      desenharLinha(linha, false);
    }

    doc.end();
  });
}

export async function gerarXlsxTabela({
  titulo,
  colunas,
  linhas,
}: TabelaRelatorio): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(titulo.slice(0, 31));

  sheet.addRow(colunas);
  sheet.getRow(1).font = { bold: true };
  for (const linha of linhas) {
    sheet.addRow(linha);
  }
  sheet.columns.forEach((coluna) => {
    coluna.width = 22;
  });

  const buffer: ArrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export async function gerarRelatorio(
  tabela: TabelaRelatorio,
  formato: Formato,
): Promise<Buffer> {
  return formato === 'pdf' ? gerarPdfTabela(tabela) : gerarXlsxTabela(tabela);
}
