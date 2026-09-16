import { Role } from '../../generated/prisma/client';

export interface JwtPayload {
  sub: string;
  role: Role;
  professorId?: string;
  alunoId?: string;
}

export interface AuthenticatedUser {
  id: string;
  role: Role;
  professorId?: string;
  alunoId?: string;
}
