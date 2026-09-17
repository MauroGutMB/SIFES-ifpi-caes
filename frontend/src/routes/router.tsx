import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import { AdminLayout } from '../layouts/AdminLayout';
import { ProfessorLayout } from '../layouts/ProfessorLayout';
import { AlunoLayout } from '../layouts/AlunoLayout';
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
import { ProfessorHomePage } from '../pages/professor/HomePage';
import { MateriaProfessorPage } from '../pages/professor/materia/MateriaProfessorPage';
import { TurmaProfessorPage } from '../pages/professor/TurmaProfessorPage';
import { AlunoHomePage } from '../pages/aluno/HomePage';
import { MinhasMateriasTab } from '../pages/aluno/MinhasMateriasTab';
import { BoletimTab } from '../pages/aluno/BoletimTab';
import { TurmaTab } from '../pages/aluno/TurmaTab';
import { SemestresTab } from '../pages/aluno/SemestresTab';
import { MateriaAlunoPage } from '../pages/aluno/materia/MateriaAlunoPage';
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
              {
                element: <ProfessorLayout />,
                children: [
                  { index: true, element: <ProfessorHomePage /> },
                  { path: 'materias/:materiaId', element: <MateriaProfessorPage /> },
                  { path: 'turmas/:turmaId', element: <TurmaProfessorPage /> },
                ],
              },
            ],
          },
          {
            path: 'aluno',
            element: <RoleGate allow={['ALUNO']} />,
            children: [
              {
                element: <AlunoLayout />,
                children: [
                  { index: true, element: <AlunoHomePage /> },
                  { path: 'materias', element: <MinhasMateriasTab /> },
                  { path: 'materias/:materiaId', element: <MateriaAlunoPage /> },
                  { path: 'boletim', element: <BoletimTab /> },
                  { path: 'turma', element: <TurmaTab /> },
                  { path: 'semestres', element: <SemestresTab /> },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/app" replace /> },
]);
