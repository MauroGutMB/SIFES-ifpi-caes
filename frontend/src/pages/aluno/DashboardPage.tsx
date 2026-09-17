import { useState } from 'react';
import { Box, Tab, Tabs, Typography } from '@mui/material';
import { useAlunosControllerMeuPerfil } from '../../api/generated/alunos/alunos';
import { MinhasMateriasTab } from './MinhasMateriasTab';
import { ContaTab } from './ContaTab';
import { BoletimTab } from './BoletimTab';
import { TurmaTab } from './TurmaTab';

export function AlunoDashboardPage() {
  const { data: perfil } = useAlunosControllerMeuPerfil();
  const [tab, setTab] = useState(0);

  return (
    <>
      <Typography variant="h4" gutterBottom>
        Olá, {perfil?.nome ?? ''}
      </Typography>

      <Tabs value={tab} onChange={(_e, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Minhas matérias" />
        <Tab label="Boletim" />
        <Tab label="Turma" />
        <Tab label="Conta" />
      </Tabs>

      <Box>
        {tab === 0 && <MinhasMateriasTab />}
        {tab === 1 && perfil && <BoletimTab alunoId={perfil.id} />}
        {tab === 2 && <TurmaTab turma={perfil?.turma ?? null} />}
        {tab === 3 && perfil && <ContaTab perfil={perfil} />}
      </Box>
    </>
  );
}
