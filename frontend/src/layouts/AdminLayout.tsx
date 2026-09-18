import DashboardIcon from '@mui/icons-material/DashboardOutlined';
import SchoolIcon from '@mui/icons-material/SchoolOutlined';
import GroupIcon from '@mui/icons-material/GroupOutlined';
import ClassIcon from '@mui/icons-material/ClassOutlined';
import EventIcon from '@mui/icons-material/EventOutlined';
import MenuBookIcon from '@mui/icons-material/MenuBookOutlined';
import PhotoCameraIcon from '@mui/icons-material/PhotoCameraOutlined';
import BadgeIcon from '@mui/icons-material/BadgeOutlined';
import ReportProblemIcon from '@mui/icons-material/ReportProblemOutlined';
import { SidebarLayout } from './SidebarLayout';
import { SidebarNavList, type SidebarNavItem } from './SidebarNavList';

const ITENS_NAV: SidebarNavItem[] = [
  { to: '/app/admin', label: 'Início', icon: <DashboardIcon fontSize="small" />, end: true },
  { to: '/app/admin/alunos', label: 'Alunos', icon: <SchoolIcon fontSize="small" /> },
  { to: '/app/admin/professores', label: 'Professores', icon: <GroupIcon fontSize="small" /> },
  { to: '/app/admin/turmas', label: 'Turmas', icon: <ClassIcon fontSize="small" /> },
  { to: '/app/admin/semestres', label: 'Semestres', icon: <EventIcon fontSize="small" /> },
  { to: '/app/admin/materias', label: 'Disciplinas', icon: <MenuBookIcon fontSize="small" /> },
  {
    to: '/app/admin/solicitacoes-foto',
    label: 'Solicitações de foto',
    icon: <PhotoCameraIcon fontSize="small" />,
  },
  {
    to: '/app/admin/pendencias',
    label: 'Pendências',
    icon: <ReportProblemIcon fontSize="small" />,
  },
  { to: '/app/admin/usuarios', label: 'Usuários', icon: <BadgeIcon fontSize="small" /> },
];

export function AdminLayout() {
  return (
    <SidebarLayout storageKey="sifes.adminSidebarWidth" nav={<SidebarNavList itens={ITENS_NAV} />} />
  );
}
