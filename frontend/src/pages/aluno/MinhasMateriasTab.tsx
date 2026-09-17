import { Box, Card, CardActionArea, CardContent, Chip, Grid, Skeleton, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useMateriasControllerFindAll } from '../../api/generated/materias/materias';
import { resumoHorarios } from '../admin/materias/dias-semana';

export function MinhasMateriasTab() {
  const { data, isLoading } = useMateriasControllerFindAll();
  const navigate = useNavigate();

  return (
    <>
      <Typography variant="h4" gutterBottom>
        Minhas matérias
      </Typography>

      {isLoading ? (
        <Grid container spacing={2}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
              <Skeleton variant="rounded" height={120} />
            </Grid>
          ))}
        </Grid>
      ) : !data?.length ? (
        <Typography color="text.secondary">
          Você ainda não está vinculado a nenhuma matéria.
        </Typography>
      ) : (
        <Grid container spacing={2}>
          {data.map((materia) => (
            <Grid key={materia.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card>
                <CardActionArea onClick={() => navigate(`/app/aluno/materias/${materia.id}`)}>
                  <CardContent>
                    <Typography variant="h6">{materia.nome}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {materia.turma.cursoTecnico} — {materia.turma.anoSerie}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Professor(a): {materia.professor.nome}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {resumoHorarios(materia.horarios)}
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      <Chip
                        size="small"
                        label={materia.estado === 'ABERTA' ? 'Aberta' : 'Encerrada'}
                        color={materia.estado === 'ABERTA' ? 'success' : 'default'}
                      />
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
