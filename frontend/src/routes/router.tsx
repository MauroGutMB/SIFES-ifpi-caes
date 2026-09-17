import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import { LoginPage } from '../pages/LoginPage';
import { ChangePasswordPage } from '../pages/ChangePasswordPage';
import { AdminDashboardPage } from '../pages/admin/DashboardPage';
import { ProfessorDashboardPage } from '../pages/professor/DashboardPage';
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
            children: [{ index: true, element: <AdminDashboardPage /> }],
          },
          {
            path: 'professor',
            element: <RoleGate allow={['PROFESSOR']} />,
            children: [{ index: true, element: <ProfessorDashboardPage /> }],
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
