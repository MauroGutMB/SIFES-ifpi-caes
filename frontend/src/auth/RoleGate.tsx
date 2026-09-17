import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';
import type { Role } from './auth.types';

export function homePathForRole(role: Role): string {
  switch (role) {
    case 'ADMIN':
      return '/app/admin';
    case 'PROFESSOR':
      return '/app/professor';
    case 'ALUNO':
      return '/app/aluno';
  }
}

export function RoleGate({ allow }: { allow: Role[] }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!allow.includes(user.role)) {
    return <Navigate to={homePathForRole(user.role)} replace />;
  }
  return <Outlet />;
}
