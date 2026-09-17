import { PrismaService } from '../prisma/prisma.service';

/** Grava um upload como linha na tabela `arquivos` e devolve a URL pública de acesso. */
export async function salvarArquivo(
  prisma: PrismaService,
  buffer: Buffer,
  mimeType: string,
): Promise<string> {
  const arquivo = await prisma.arquivo.create({
    data: { mimeType, conteudo: new Uint8Array(buffer) },
  });
  return `/arquivos/${arquivo.id}`;
}

/** Remove o Arquivo referenciado por uma URL no formato `/arquivos/:id` (no-op se a URL for nula
 * ou o registro já não existir mais). */
export async function removerArquivo(
  prisma: PrismaService,
  arquivoUrl: string | null | undefined,
): Promise<void> {
  const id = arquivoUrl?.split('/').pop();
  if (!id) return;
  await prisma.arquivo.delete({ where: { id } }).catch(() => undefined);
}
