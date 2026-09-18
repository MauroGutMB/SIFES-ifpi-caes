import { useState } from 'react';
import { Box, Button, Chip, Tab, Tabs, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBackOutlined';
import { useNavigate, useParams } from 'react-router-dom';
import { useMateriasControllerFindAll } from '../../../api/generated/materias/materias';
import { resumoHorarios } from '../../admin/materias/dias-semana';
import { LancarAulaTab } from './LancarAulaTab';
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
        Minhas disciplinas
      </Button>

      {materia && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="h4">{materia.nome}</Typography>
          <Typography variant="body2" color="text.secondary">
            {materia.turma.cursoTecnico} — {materia.turma.anoSerie}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {resumoHorarios(materia.horarios)}
            <Chip
              size="small"
              label={materia.estado === 'ABERTA' ? 'Aberta' : 'Encerrada'}
              color={materia.estado === 'ABERTA' ? 'success' : 'default'}
            />
          </Typography>
        </Box>
      )}

      <Tabs
        value={tab}
        onChange={(_e, v) => setTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={{ mb: 2 }}
      >
        <Tab label="Lançar aula" />
        <Tab label="Plano de disciplina" />
        <Tab label="Diário" />
        <Tab label="Atividades" />
        <Tab label="Relatórios" />
      </Tabs>

      {materia && (
        <>
          {tab === 0 && <LancarAulaTab materiaId={materiaId} />}
          {tab === 1 && (
            <PlanoTab
              materiaId={materiaId}
              materiaAberta={materia.estado === 'ABERTA'}
              notaMinimaAprovacao={materia.notaMinimaAprovacao}
            />
          )}
          {tab === 2 && <DiarioTab materiaId={materiaId} />}
          {tab === 3 && <AtividadesTab materiaId={materiaId} materiaAberta={materia.estado === 'ABERTA'} />}
          {tab === 4 && <RelatoriosTab materiaId={materiaId} />}
        </>
      )}
    </>
  );
}
