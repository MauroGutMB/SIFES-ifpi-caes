interface Assinatura {
  bytes: number[];
  offset?: number;
}

// PPT/DOC legado (OLE compound) e PPTX/DOCX (zip OOXML) compartilham a mesma assinatura de
// contêiner — o que muda é a extensão/mimetype declarado, não os bytes iniciais do arquivo.
const ASSINATURA_OLE: Assinatura = {
  bytes: [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1],
};
const ASSINATURA_ZIP: Assinatura = { bytes: [0x50, 0x4b, 0x03, 0x04] };

const ASSINATURAS_POR_MIME: Record<string, Assinatura[]> = {
  'image/png': [{ bytes: [0x89, 0x50, 0x4e, 0x47] }],
  'image/jpeg': [{ bytes: [0xff, 0xd8, 0xff] }],
  'application/pdf': [{ bytes: [0x25, 0x50, 0x44, 0x46] }],
  'application/msword': [ASSINATURA_OLE],
  'application/vnd.ms-powerpoint': [ASSINATURA_OLE],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
    ASSINATURA_ZIP,
  ],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': [
    ASSINATURA_ZIP,
  ],
};

/**
 * Confere se o CONTEÚDO real do arquivo (magic bytes) bate com algum dos mimeTypes esperados.
 * O `Content-Type` do multipart é escolhido pelo cliente e é trivialmente falsificável — nunca
 * deve ser a única checagem de tipo antes de persistir um upload. Um mimeType sem assinatura
 * conhecida é tratado como não confiável (retorna false) em vez de aceito por omissão.
 */
export function validarAssinaturaArquivo(
  buffer: Buffer,
  mimeTypesEsperados: string[],
): boolean {
  return mimeTypesEsperados.some((mime) => {
    const assinaturas = ASSINATURAS_POR_MIME[mime];
    if (!assinaturas) return false;
    return assinaturas.some(({ bytes, offset = 0 }) =>
      bytes.every((byte, i) => buffer[offset + i] === byte),
    );
  });
}
