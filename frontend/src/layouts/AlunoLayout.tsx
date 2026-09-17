import HomeIcon from '@mui/icons-material/HomeOutlined';
import MenuBookIcon from '@mui/icons-material/MenuBookOutlined';
import AssessmentIcon from '@mui/icons-material/AssessmentOutlined';
import ClassIcon from '@mui/icons-material/ClassOutlined';
import EventIcon from '@mui/icons-material/EventOutlined';
import { SidebarLayout } from './SidebarLayout';
import { SidebarNavList, type SidebarNavItem } from './SidebarNavList';

const ITENS_NAV: SidebarNavItem[] = [
  { to: '/app/aluno', label: 'Início', icon: <HomeIcon fontSize="small" />, end: true },
  { to: '/app/aluno/materias', label: 'Minhas matérias', icon: <MenuBookIcon fontSize="small" /> },
  { to: '/app/aluno/boletim', label: 'Boletim', icon: <AssessmentIcon fontSize="small" /> },
  { to: '/app/aluno/turma', label: 'Turma', icon: <ClassIcon fontSize="small" /> },
  { to: '/app/aluno/semestres', label: 'Semestres', icon: <EventIcon fontSize="small" /> },
];

export function AlunoLayout() {
  return (
    <SidebarLayout storageKey="sifes.alunoSidebarWidth" nav={<SidebarNavList itens={ITENS_NAV} />} />
  );
}
