import { axiosInstance } from './axios-instance';

export async function baixarArquivo(url: string, nomeArquivo: string): Promise<void> {
  const resposta = await axiosInstance.get(url, { responseType: 'blob' });
  const objectUrl = URL.createObjectURL(resposta.data as Blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = nomeArquivo;
  link.click();
  URL.revokeObjectURL(objectUrl);
}
