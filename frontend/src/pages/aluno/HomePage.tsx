import { Box, Card, CardActionArea, CardContent, Grid, Stack, Typography } from '@mui/material';
import InsightsIcon from '@mui/icons-material/InsightsOutlined';
import ChevronRightIcon from '@mui/icons-material/ChevronRightOutlined';
import { useNavigate } from 'react-router-dom';
import { useAlunosControllerMeuPerfil } from '../../api/generated/alunos/alunos';
import { useMateriasControllerFindAll } from '../../api/generated/materias/materias';
import { WeeklyAgenda } from '../../components/WeeklyAgenda';
import { ContaTab } from './ContaTab';

export function AlunoHomePage() {
  const navigate = useNavigate();
  const { data: perfil } = useAlunosControllerMeuPerfil();
  const { data: materias } = useMateriasControllerFindAll();

  return (
    <>
      <Typography variant="h4" gutterBottom>
        Olá, {perfil?.nome ?? ''}
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 5 }}>
          <Stack spacing={2}>
            {perfil && <ContaTab perfil={perfil} />}
            <Card variant="outlined">
              <CardActionArea onClick={() => navigate('/app/aluno/situacao')}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <InsightsIcon color="primary" />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle2">Minha situação</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Presença, atividades e disciplinas em um só lugar
                    </Typography>
                  </Box>
                  <ChevronRightIcon color="action" />
                </CardContent>
              </CardActionArea>
            </Card>
          </Stack>
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
