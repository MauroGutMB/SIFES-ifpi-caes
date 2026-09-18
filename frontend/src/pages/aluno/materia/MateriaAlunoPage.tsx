import { useState } from 'react';
import { Box, Button, Chip, Tab, Tabs, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBackOutlined';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useMateriasControllerFindAll } from '../../../api/generated/materias/materias';
import { resumoHorarios } from '../../admin/materias/dias-semana';
import { SituacaoTab } from './SituacaoTab';
import { AulasAlunoTab } from './AulasAlunoTab';
import { AtividadesAlunoTab } from './AtividadesAlunoTab';

export function MateriaAlunoPage() {
  const { materiaId = '' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: materias } = useMateriasControllerFindAll();
  const materia = materias?.find((m) => m.id === materiaId);
  const [tab, setTab] = useState((location.state as { tab?: number } | null)?.tab ?? 0);

  return (
    <>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/app/aluno/materias')}
        sx={{ mb: 1 }}
      >
        Minhas disciplinas
      </Button>

      {materia && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="h4">{materia.nome}</Typography>
          <Typography variant="body2" color="text.secondary">
            {materia.turma.cursoTecnico} — {materia.turma.anoSerie}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            Professor(a) {materia.professor.nome} · {resumoHorarios(materia.horarios)}
            <Chip
              size="small"
              label={materia.estado === 'ABERTA' ? 'Aberta' : 'Encerrada'}
              color={materia.estado === 'ABERTA' ? 'success' : 'default'}
            />
          </Typography>
        </Box>
      )}

      <Tabs value={tab} onChange={(_e, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Situação" />
        <Tab label="Aulas" />
        <Tab label="Atividades" />
      </Tabs>

      {tab === 0 && <SituacaoTab materiaId={materiaId} />}
      {tab === 1 && <AulasAlunoTab materiaId={materiaId} />}
      {tab === 2 && <AtividadesAlunoTab materiaId={materiaId} />}
    </>
  );
}
