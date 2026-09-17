import { useState } from 'react';
import { Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { useMateriaAtividadesControllerListar } from '../../../api/generated/atividades/atividades';
import type { AtividadeDto } from '../../../api/generated/models';
import { EntregaAlunoDialog } from './EntregaAlunoDialog';

interface AtividadesAlunoTabProps {
  materiaId: string;
}

export function AtividadesAlunoTab({ materiaId }: AtividadesAlunoTabProps) {
  const { data, isLoading } = useMateriaAtividadesControllerListar(materiaId);
  const [selecionada, setSelecionada] = useState<AtividadeDto | null>(null);

  return (
    <>
      <Paper variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Título</TableCell>
              <TableCell>Formato</TableCell>
              <TableCell>Criada em</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!isLoading &&
              (data ?? []).map((atividade) => (
                <TableRow
                  key={atividade.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => setSelecionada(atividade)}
                >
                  <TableCell>{atividade.titulo}</TableCell>
                  <TableCell>{atividade.formatoExigido}</TableCell>
                  <TableCell>{new Date(atividade.criadaEm).toLocaleDateString('pt-BR')}</TableCell>
                </TableRow>
              ))}
            {!isLoading && !data?.length && (
              <TableRow>
                <TableCell colSpan={3}>
                  <Typography color="text.secondary" variant="body2">
                    Nenhuma atividade cadastrada ainda.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      <EntregaAlunoDialog atividade={selecionada} onClose={() => setSelecionada(null)} />
    </>
  );
}
