export type Role = 'ADMIN' | 'PROFESSOR' | 'ALUNO';

export interface AuthUser {
  role: Role;
  precisaTrocarSenha: boolean;
}
