import { SetMetadata } from '@nestjs/common';
import { Role } from '../../../generated/prisma/client';

export const ROLES_KEY = 'roles';

/** Restringe a rota aos perfis informados (ADMIN, PROFESSOR, ALUNO). */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
