import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import { AdminLayout } from '../layouts/AdminLayout';
import { LoginPage } from '../pages/LoginPage';
import { ChangePasswordPage } from '../pages/ChangePasswordPage';
import { AdminDashboardPage } from '../pages/admin/DashboardPage';
import { SemestresPage } from '../pages/admin/semestres/SemestresPage';
import { TurmasPage } from '../pages/admin/turmas/TurmasPage';
import { ProfessoresPage } from '../pages/admin/professores/ProfessoresPage';
import { AlunosPage } from '../pages/admin/alunos/AlunosPage';
import { MateriasPage } from '../pages/admin/materias/MateriasPage';
import { UsuariosPage } from '../pages/admin/usuarios/UsuariosPage';
import { SolicitacoesFotoPage } from '../pages/admin/solicitacoes-foto/SolicitacoesFotoPage';
import { ProfessorDashboardPage } from '../pages/professor/DashboardPage';
import { MateriaProfessorPage } from '../pages/professor/materia/MateriaProfessorPage';
import { AlunoDashboardPage } from '../pages/aluno/DashboardPage';
import { SessionGate } from '../auth/SessionGate';
import { RoleGate } from '../auth/RoleGate';
import { HomeRedirect } from '../auth/HomeRedirect';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <SessionGate />,
    children: [
      { path: '/trocar-senha', element: <ChangePasswordPage /> },
      {
        path: '/app',
        element: <AppLayout />,
        children: [
          { index: true, element: <HomeRedirect /> },
          {
            path: 'admin',
            element: <RoleGate allow={['ADMIN']} />,
            children: [
              {
                element: <AdminLayout />,
                children: [
                  { index: true, element: <AdminDashboardPage /> },
                  { path: 'alunos', element: <AlunosPage /> },
                  { path: 'professores', element: <ProfessoresPage /> },
                  { path: 'turmas', element: <TurmasPage /> },
                  { path: 'semestres', element: <SemestresPage /> },
                  { path: 'materias', element: <MateriasPage /> },
                  { path: 'solicitacoes-foto', element: <SolicitacoesFotoPage /> },
                  { path: 'usuarios', element: <UsuariosPage /> },
                ],
              },
            ],
          },
          {
            path: 'professor',
            element: <RoleGate allow={['PROFESSOR']} />,
            children: [
              { index: true, element: <ProfessorDashboardPage /> },
              { path: 'materias/:materiaId', element: <MateriaProfessorPage /> },
            ],
          },
          {
            path: 'aluno',
            element: <RoleGate allow={['ALUNO']} />,
            children: [{ index: true, element: <AlunoDashboardPage /> }],
          },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/app" replace /> },
]);
