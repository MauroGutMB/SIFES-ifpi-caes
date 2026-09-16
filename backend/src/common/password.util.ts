import { randomInt } from 'crypto';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sem 0/O/1/I, evita confusão

/** Senha inicial legível, gerada uma única vez na criação do usuário (Professor/Aluno). */
export function gerarSenhaInicial(tamanho = 8): string {
  let senha = '';
  for (let i = 0; i < tamanho; i++) {
    senha += ALPHABET[randomInt(ALPHABET.length)];
  }
  return senha;
}
