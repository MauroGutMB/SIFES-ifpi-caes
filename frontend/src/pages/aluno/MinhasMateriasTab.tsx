import { Box, Card, CardActionArea, CardContent, Chip, Divider, Grid, Skeleton, Stack, Typography } from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutlineOutlined';
import ClassOutlinedIcon from '@mui/icons-material/ClassOutlined';
import ScheduleIcon from '@mui/icons-material/ScheduleOutlined';
import ChevronRightIcon from '@mui/icons-material/ChevronRightOutlined';
import InboxIcon from '@mui/icons-material/InboxOutlined';
import { useNavigate } from 'react-router-dom';
import { useMateriasControllerFindAll } from '../../api/generated/materias/materias';
import { resumoHorarios } from '../admin/materias/dias-semana';
import { tokens } from '../../theme/tokens';

export function MinhasMateriasTab() {
  const { data, isLoading } = useMateriasControllerFindAll();
  const navigate = useNavigate();

  return (
    <>
      <Typography variant="h4" gutterBottom>
        Minhas matérias
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Toque em uma matéria para ver plano de aula, atividades e frequência dela.
      </Typography>

      {isLoading ? (
        <Grid container spacing={2}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
              <Skeleton variant="rounded" height={140} />
            </Grid>
          ))}
        </Grid>
      ) : !data?.length ? (
        <Stack spacing={1} sx={{ alignItems: 'center', py: 6, color: tokens.textSecondary }}>
          <InboxIcon />
          <Typography color="text.secondary">
            Você ainda não está vinculado a nenhuma matéria.
          </Typography>
        </Stack>
      ) : (
        <Grid container spacing={2}>
          {data.map((materia) => (
            <Grid key={materia.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card sx={{ height: '100%' }}>
                <CardActionArea
                  onClick={() => navigate(`/app/aluno/materias/${materia.id}`)}
                  sx={{ height: '100%', display: 'flex', alignItems: 'stretch' }}
                >
                  <CardContent sx={{ width: '100%' }}>
                    <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="h6">{materia.nome}</Typography>
                      <Chip
                        size="small"
                        label={materia.estado === 'ABERTA' ? 'Aberta' : 'Encerrada'}
                        color={materia.estado === 'ABERTA' ? 'success' : 'default'}
                      />
                    </Stack>

                    <Divider sx={{ mb: 1.5 }} />

                    <Stack spacing={0.75}>
                      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                        <PersonOutlineIcon fontSize="inherit" sx={{ color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {materia.professor.nome}
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                        <ClassOutlinedIcon fontSize="inherit" sx={{ color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {materia.turma.cursoTecnico} — {materia.turma.anoSerie}
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                        <ScheduleIcon fontSize="inherit" sx={{ color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {resumoHorarios(materia.horarios)}
                        </Typography>
                      </Stack>
                    </Stack>

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                      <ChevronRightIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </>
  );
}
