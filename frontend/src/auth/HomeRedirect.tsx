import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { homePathForRole } from './RoleGate';

export function HomeRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={homePathForRole(user.role)} replace />;
}
