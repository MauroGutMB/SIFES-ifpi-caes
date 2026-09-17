import { Avatar, Box, Grid, Paper, Stack, Typography } from '@mui/material';
import { useUsersControllerMe } from '../../api/generated/users/users';
import { useMateriasControllerFindAll } from '../../api/generated/materias/materias';
import { WeeklyAgenda } from '../../components/WeeklyAgenda';

export function ProfessorHomePage() {
  const { data: me } = useUsersControllerMe();
  const { data: materias } = useMateriasControllerFindAll();
  const professor = materias?.[0]?.professor;

  return (
    <>
      <Typography variant="h4" gutterBottom>
        Olá, {professor?.nome ?? ''}
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 2 }}>
              <Avatar src={me?.fotoUrl ?? undefined} sx={{ width: 64, height: 64 }} />
              <div>
                <Typography variant="h6">{professor?.nome ?? me?.login}</Typography>
                {professor && (
                  <Typography variant="body2" color="text.secondary">
                    {professor.email}
                  </Typography>
                )}
              </div>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {materias?.length ?? 0} matéria(s) atribuída(s)
            </Typography>
          </Paper>
        </Grid>
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
