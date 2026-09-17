import { Box, Grid, Typography } from '@mui/material';
import { useAlunosControllerMeuPerfil } from '../../api/generated/alunos/alunos';
import { useMateriasControllerFindAll } from '../../api/generated/materias/materias';
import { WeeklyAgenda } from '../../components/WeeklyAgenda';
import { ContaTab } from './ContaTab';

export function AlunoHomePage() {
  const { data: perfil } = useAlunosControllerMeuPerfil();
  const { data: materias } = useMateriasControllerFindAll();

  return (
    <>
      <Typography variant="h4" gutterBottom>
        Olá, {perfil?.nome ?? ''}
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 5 }}>{perfil && <ContaTab perfil={perfil} />}</Grid>
        <Grid size={{ xs: 12, md: 7 }}>
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Agenda da semana
            </Typography>
            <WeeklyAgenda
              itens={(materias ?? []).map((m) => ({
                id: m.id,
                titulo: m.nome,
                subtitulo: `${m.turma.cursoTecnico} — ${m.turma.anoSerie}`,
                horarios: m.horarios,
              }))}
            />
          </Box>
        </Grid>
      </Grid>
    </>
  );
}
