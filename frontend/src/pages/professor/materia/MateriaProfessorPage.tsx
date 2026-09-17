import { useState } from 'react';
import { Box, Button, Chip, Tab, Tabs, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBackOutlined';
import { useNavigate, useParams } from 'react-router-dom';
import { useMateriasControllerFindAll } from '../../../api/generated/materias/materias';
import { labelDiaSemana } from '../../admin/materias/dias-semana';
import { PlanoTab } from './PlanoTab';
import { DiarioTab } from './DiarioTab';
import { AtividadesTab } from './AtividadesTab';
import { RelatoriosTab } from './RelatoriosTab';

export function MateriaProfessorPage() {
  const { materiaId = '' } = useParams();
  const navigate = useNavigate();
  const { data: materias } = useMateriasControllerFindAll();
  const materia = materias?.find((m) => m.id === materiaId);
  const [tab, setTab] = useState(0);

  return (
    <>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/app/professor')} sx={{ mb: 1 }}>
        Minhas matérias
      </Button>

      {materia && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="h4">
            {materia.turma.cursoTecnico} — {materia.turma.anoSerie}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {labelDiaSemana(materia.diaSemana)} às {materia.horaInicio}
            <Chip
              size="small"
              label={materia.estado === 'ABERTA' ? 'Aberta' : 'Encerrada'}
              color={materia.estado === 'ABERTA' ? 'success' : 'default'}
            />
          </Typography>
        </Box>
      )}

      <Tabs value={tab} onChange={(_e, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Plano de disciplina" />
        <Tab label="Diário" />
        <Tab label="Atividades" />
        <Tab label="Relatórios" />
      </Tabs>

      {materia && (
        <>
          {tab === 0 && <PlanoTab materiaId={materiaId} materiaAberta={materia.estado === 'ABERTA'} />}
          {tab === 1 && <DiarioTab materiaId={materiaId} />}
          {tab === 2 && <AtividadesTab materiaId={materiaId} materiaAberta={materia.estado === 'ABERTA'} />}
          {tab === 3 && <RelatoriosTab materiaId={materiaId} />}
        </>
      )}
    </>
  );
}
