import { axiosInstance } from './axios-instance';

const EXTENSAO_POR_MIME: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
};

export async function baixarArquivo(url: string, nomeArquivo: string): Promise<void> {
  const resposta = await axiosInstance.get(url, { responseType: 'blob' });
  const blob = resposta.data as Blob;

  // Quando quem chamou não sabe a extensão de antemão (ex: anexo de atividade, cujo Arquivo
  // não guarda o nome original), completa a partir do mimeType real da resposta.
  const extensao = EXTENSAO_POR_MIME[blob.type];
  const nomeFinal = /\.[a-zA-Z0-9]+$/.test(nomeArquivo) || !extensao
    ? nomeArquivo
    : `${nomeArquivo}.${extensao}`;

  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = nomeFinal;
  link.click();
  URL.revokeObjectURL(objectUrl);
}
