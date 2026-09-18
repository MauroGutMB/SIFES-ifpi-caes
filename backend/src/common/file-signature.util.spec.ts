import { validarAssinaturaArquivo } from './file-signature.util';

describe('validarAssinaturaArquivo', () => {
  it('aceita um PNG real', () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(validarAssinaturaArquivo(png, ['image/png'])).toBe(true);
  });

  it('rejeita HTML disfarçado de PNG pelo mimetype declarado', () => {
    const html = Buffer.from('<script>alert(1)</script>');
    expect(validarAssinaturaArquivo(html, ['image/png'])).toBe(false);
  });

  it('rejeita mimeType sem assinatura conhecida em vez de aceitar por omissão', () => {
    const conteudo = Buffer.from('qualquer coisa');
    expect(validarAssinaturaArquivo(conteudo, ['text/html'])).toBe(false);
  });
});
