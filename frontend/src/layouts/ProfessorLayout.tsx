import HomeIcon from '@mui/icons-material/HomeOutlined';
import MenuBookIcon from '@mui/icons-material/MenuBookOutlined';
import ClassIcon from '@mui/icons-material/ClassOutlined';
import { useMateriasControllerFindAll } from '../api/generated/materias/materias';
import { SidebarLayout } from './SidebarLayout';
import { SidebarNavList, type SidebarNavItem } from './SidebarNavList';

export function ProfessorLayout() {
  const { data: materias } = useMateriasControllerFindAll();

  const itensInicio: SidebarNavItem[] = [
    { to: '/app/professor', label: 'Início', icon: <HomeIcon fontSize="small" />, end: true },
  ];

  // Só as disciplinas em curso — as de semestres já encerrados ficam de fora da navegação
  // do dia a dia (continuam acessíveis pelo histórico do aluno/relatórios, só não aqui).
  const materiasAbertas = (materias ?? []).filter((m) => m.estado === 'ABERTA');

  const itensDisciplinas: SidebarNavItem[] = materiasAbertas.map((m) => ({
    to: `/app/professor/materias/${m.id}`,
    label: m.nome,
    icon: <MenuBookIcon fontSize="small" />,
  }));

  const turmasUnicas = new Map<string, { cursoTecnico: string; anoSerie: string }>();
  for (const m of materiasAbertas) {
    turmasUnicas.set(m.turmaId, {
      cursoTecnico: m.turma.cursoTecnico,
      anoSerie: m.turma.anoSerie,
    });
  }
  const itensTurmas: SidebarNavItem[] = [...turmasUnicas.entries()].map(([turmaId, turma]) => ({
    to: `/app/professor/turmas/${turmaId}`,
    label: `${turma.cursoTecnico} — ${turma.anoSerie}`,
    icon: <ClassIcon fontSize="small" />,
  }));

  return (
    <SidebarLayout
      storageKey="sifes.professorSidebarWidth"
      nav={
        <>
          <SidebarNavList itens={itensInicio} />
          <SidebarNavList titulo="Minhas disciplinas" itens={itensDisciplinas} />
          <SidebarNavList titulo="Minhas turmas" itens={itensTurmas} />
        </>
      }
    />
  );
}
