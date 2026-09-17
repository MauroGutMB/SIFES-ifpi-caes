import { useState } from 'react';
import {
  Box,
  Button,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/EditOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutlineOutlined';
import VisibilityIcon from '@mui/icons-material/VisibilityOutlined';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { isAxiosError } from 'axios';
import { useQueryClient } from '@tanstack/react-query';
import {
  getMateriaAtividadesControllerListarQueryKey,
  useAtividadesControllerAtualizar,
  useAtividadesControllerRemover,
  useMateriaAtividadesControllerCriar,
  useMateriaAtividadesControllerListar,
} from '../../../api/generated/atividades/atividades';
import { MateriaAtividadesControllerCriarBody } from '../../../api/generated/zod/atividades/atividades';
import type { AtividadeDto } from '../../../api/generated/models';
import { FormDialog } from '../../../components/FormDialog';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { EntregasDialog } from './EntregasDialog';

type FormValues = z.infer<typeof MateriaAtividadesControllerCriarBody>;

const FORMATOS = [
  { value: 'PDF', label: 'PDF' },
  { value: 'WORD', label: 'Word' },
  { value: 'FOTO', label: 'Foto' },
] as const;

interface AtividadesTabProps {
  materiaId: string;
  materiaAberta: boolean;
}

export function AtividadesTab({ materiaId, materiaAberta }: AtividadesTabProps) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useMateriaAtividadesControllerListar(materiaId);
  const criar = useMateriaAtividadesControllerCriar();
  const atualizar = useAtividadesControllerAtualizar();
  const remover = useAtividadesControllerRemover();

  const [editando, setEditando] = useState<AtividadeDto | null>(null);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [paraExcluir, setParaExcluir] = useState<AtividadeDto | null>(null);
  const [entregasDe, setEntregasDe] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(MateriaAtividadesControllerCriarBody) });

  const invalidar = () =>
    queryClient.invalidateQueries({
      queryKey: getMateriaAtividadesControllerListarQueryKey(materiaId),
    });

  const abrirNovo = () => {
    setEditando(null);
    reset({ titulo: '', descricao: '', formatoExigido: 'PDF' });
    setErro(null);
    setDialogAberto(true);
  };

  const abrirEdicao = (atividade: AtividadeDto) => {
    setEditando(atividade);
    reset({
      titulo: atividade.titulo,
      descricao: atividade.descricao ?? '',
      formatoExigido: atividade.formatoExigido,
    });
    setErro(null);
    setDialogAberto(true);
  };

  const salvar = handleSubmit(async (dados) => {
    setErro(null);
    try {
      if (editando) {
        await atualizar.mutateAsync({ id: editando.id, data: dados });
      } else {
        await criar.mutateAsync({ materiaId, data: dados });
      }
      await invalidar();
      setDialogAberto(false);
    } catch (error) {
      setErro(
        isAxiosError(error)
          ? ((error.response?.data as { message?: string } | undefined)?.message ??
            'Não foi possível salvar')
          : 'Não foi possível salvar',
      );
    }
  });

  const excluir = async () => {
    if (!paraExcluir) return;
    await remover.mutateAsync({ id: paraExcluir.id });
    await invalidar();
    setParaExcluir(null);
  };

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Atividades</Typography>
        {materiaAberta && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={abrirNovo}>
            Nova atividade
          </Button>
        )}
      </Box>

      <Paper variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Título</TableCell>
              <TableCell>Formato</TableCell>
              <TableCell>Criada em</TableCell>
              <TableCell width={140} />
            </TableRow>
          </TableHead>
          <TableBody>
            {!isLoading &&
              (data ?? []).map((atividade) => (
                <TableRow key={atividade.id}>
                  <TableCell>{atividade.titulo}</TableCell>
                  <TableCell>{atividade.formatoExigido}</TableCell>
                  <TableCell>{new Date(atividade.criadaEm).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>
                    <Stack direction="row">
                      <IconButton size="small" onClick={() => setEntregasDe(atividade.id)}>
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                      {materiaAberta && (
                        <>
                          <IconButton size="small" onClick={() => abrirEdicao(atividade)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={() => setParaExcluir(atividade)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            {!isLoading && !data?.length && (
              <TableRow>
                <TableCell colSpan={4}>
                  <Typography color="text.secondary" variant="body2">
                    Nenhuma atividade cadastrada.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      <FormDialog
        open={dialogAberto}
        title={editando ? 'Editar atividade' : 'Nova atividade'}
        submitLabel={editando ? 'Salvar atividade' : 'Criar atividade'}
        onClose={() => setDialogAberto(false)}
        onSubmit={salvar}
        error={erro}
        submitting={criar.isPending || atualizar.isPending}
      >
        <TextField
          {...register('titulo')}
          label="Título"
          error={!!errors.titulo}
          helperText={errors.titulo?.message}
          fullWidth
          autoFocus
        />
        <TextField
          {...register('descricao')}
          label="Descrição"
          multiline
          minRows={2}
          error={!!errors.descricao}
          helperText={errors.descricao?.message}
          fullWidth
        />
        <TextField
          {...register('formatoExigido')}
          select
          label="Formato exigido"
          error={!!errors.formatoExigido}
          helperText={errors.formatoExigido?.message}
          fullWidth
          defaultValue="PDF"
        >
          {FORMATOS.map((f) => (
            <MenuItem key={f.value} value={f.value}>
              {f.label}
            </MenuItem>
          ))}
        </TextField>
      </FormDialog>

      <ConfirmDialog
        open={!!paraExcluir}
        title="Excluir atividade"
        description={`Tem certeza que deseja excluir "${paraExcluir?.titulo}"? As entregas dos alunos também são removidas.`}
        confirmLabel="Excluir"
        confirmColor="error"
        loading={remover.isPending}
        onConfirm={excluir}
        onClose={() => setParaExcluir(null)}
      />

      <EntregasDialog atividadeId={entregasDe} onClose={() => setEntregasDe(null)} />
    </>
  );
}
