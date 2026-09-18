import { Card, CardContent, Chip, Grid, Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { useMateriaPlanoControllerBoletim } from '../../../api/generated/plano-disciplina/plano-disciplina';
import { useMateriaPlanoControllerMeuDetalhamento } from '../../../api/generated/plano-disciplina/plano-disciplina';
import { corMedia } from '../../../utils/corMedia';

interface SituacaoTabProps {
  materiaId: string;
  notaMinimaAprovacao: string;
}

const LABEL_SITUACAO: Record<string, { label: string; color: 'default' | 'success' | 'error' }> = {
  CURSANDO: { label: 'Cursando', color: 'default' },
  APROVADO: { label: 'Aprovado', color: 'success' },
  REPROVADO: { label: 'Reprovado', color: 'error' },
};

export function SituacaoTab({ materiaId, notaMinimaAprovacao }: SituacaoTabProps) {
  const { data: boletim, isLoading } = useMateriaPlanoControllerBoletim(materiaId);
  const { data: itens, isLoading: carregandoItens } = useMateriaPlanoControllerMeuDetalhamento(materiaId);

  const minhaLinha = boletim?.[0];

  return (
    <>
      {!isLoading && minhaLinha && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  Média
                </Typography>
                <Typography
                  variant="h4"
                  sx={{
                    color: corMedia(
                      minhaLinha.notaFinal,
                      minhaLinha.notaParcial,
                      Number(notaMinimaAprovacao),
                    ),
                  }}
                >
                  {minhaLinha.notaFinal.toFixed(1)}
                </Typography>
                {minhaLinha.notaParcial && (
                  <Typography variant="caption" color="text.secondary">
                    Parcial — falta lançar alguma nota
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  Frequência
                </Typography>
                <Typography variant="h4">{minhaLinha.frequenciaPercentual.toFixed(0)}%</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  Situação
                </Typography>
                <Chip
                  label={LABEL_SITUACAO[minhaLinha.situacao].label}
                  color={LABEL_SITUACAO[minhaLinha.situacao].color}
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Typography variant="h6" sx={{ mb: 1 }}>
        Detalhamento por item
      </Typography>
      <Paper variant="outlined" sx={{ overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Item</TableCell>
              <TableCell>Valor máximo</TableCell>
              <TableCell>Sua nota</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!carregandoItens &&
              (itens ?? []).map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.nome}</TableCell>
                  <TableCell>{item.valorMaximo}</TableCell>
                  <TableCell>
                    {item.notaLancada ? (
                      item.valorObtido
                    ) : (
                      <Chip size="small" variant="outlined" label="Não lançado" />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            {!carregandoItens && !itens?.length && (
              <TableRow>
                <TableCell colSpan={3}>
                  <Typography color="text.secondary" variant="body2">
                    Nenhum item de avaliação lançado ainda.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </>
  );
}
