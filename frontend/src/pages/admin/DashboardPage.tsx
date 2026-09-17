import { Card, CardContent, Grid, Skeleton, Typography } from '@mui/material';
import { useAdminDashboardControllerContagens } from '../../api/generated/admin-dashboard/admin-dashboard';

interface CartaoProps {
  titulo: string;
  valor: number | string;
  destaque?: boolean;
}

function Cartao({ titulo, valor, destaque }: CartaoProps) {
  return (
    <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
      <Card>
        <CardContent>
          <Typography variant="body2" color="text.secondary">
            {titulo}
          </Typography>
          <Typography variant="h4" color={destaque ? 'error' : undefined}>
            {valor}
          </Typography>
        </CardContent>
      </Card>
    </Grid>
  );
}

export function AdminDashboardPage() {
  const { data, isLoading } = useAdminDashboardControllerContagens();

  return (
    <>
      <Typography variant="h4" gutterBottom>
        Painel do administrador
      </Typography>

      {isLoading || !data ? (
        <Grid container spacing={2}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <Skeleton variant="rounded" height={96} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Grid container spacing={2}>
          <Cartao
            titulo="Semestre atual"
            valor={data.semestreAtual?.nome ?? 'Nenhum'}
          />
          <Cartao titulo="Professores" valor={data.totalProfessores} />
          <Cartao titulo="Alunos" valor={data.totalAlunos} />
          <Cartao titulo="Alunos sem turma" valor={data.alunosSemTurma} />
          <Cartao
            titulo="Matérias no semestre atual"
            valor={data.materiasSemestreAtual}
          />
          <Cartao
            titulo="Alunos com pendência"
            valor={data.alunosComPendencia}
            destaque={data.alunosComPendencia > 0}
          />
        </Grid>
      )}
    </>
  );
}
