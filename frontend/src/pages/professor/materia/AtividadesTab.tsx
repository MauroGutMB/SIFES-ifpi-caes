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
import AttachFileIcon from '@mui/icons-material/AttachFileOutlined';
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
import { baixarArquivo } from '../../../api/download';

type FormValues = z.infer<typeof MateriaAtividadesControllerCriarBody>;

const FORMATOS = [
  { value: 'PDF', label: 'PDF' },
  { value: 'WORD', label: 'Word' },
  { value: 'FOTO', label: 'Foto' },
] as const;

/** Converte um ISO completo pra "YYYY-MM-DDTHH:mm", formato aceito por <input type="datetime-local">. */
function paraDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

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
  const [anexo, setAnexo] = useState<File | null>(null);

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
    reset({ titulo: '', descricao: '', formatoExigido: 'PDF', prazo: '' });
    setAnexo(null);
    setErro(null);
    setDialogAberto(true);
  };

  const abrirEdicao = (atividade: AtividadeDto) => {
    setEditando(atividade);
    reset({
      titulo: atividade.titulo,
      descricao: atividade.descricao ?? '',
      formatoExigido: atividade.formatoExigido,
      prazo: atividade.prazo ? paraDatetimeLocal(atividade.prazo) : '',
    });
    setAnexo(null);
    setErro(null);
    setDialogAberto(true);
  };

  const salvar = handleSubmit(async (dados) => {
    setErro(null);
    try {
      if (editando) {
        await atualizar.mutateAsync({ id: editando.id, data: { ...dados, anexo: anexo ?? undefined } });
      } else {
        await criar.mutateAsync({ materiaId, data: { ...dados, anexo: anexo ?? undefined } });
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
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Atividades</Typography>
        {materiaAberta && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={abrirNovo}>
            Nova atividade
          </Button>
        )}
      </Box>

      <Paper variant="outlined" sx={{ overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Título</TableCell>
              <TableCell>Formato</TableCell>
              <TableCell>Anexo</TableCell>
              <TableCell>Prazo</TableCell>
              <TableCell width={140} />
            </TableRow>
          </TableHead>
          <TableBody>
            {!isLoading &&
              (data ?? []).map((atividade) => {
                const vencido = !!atividade.prazo && new Date() > new Date(atividade.prazo);
                return (
                <TableRow key={atividade.id}>
                  <TableCell>{atividade.titulo}</TableCell>
                  <TableCell>{atividade.formatoExigido}</TableCell>
                  <TableCell>
                    {atividade.arquivoUrl ? (
                      <Button
                        size="small"
                        onClick={() =>
                          void baixarArquivo(atividade.arquivoUrl!, `anexo-${atividade.titulo}`)
                        }
                      >
                        Baixar
                      </Button>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell sx={{ color: vencido ? 'error.main' : undefined }}>
                    {atividade.prazo ? new Date(atividade.prazo).toLocaleString('pt-BR') : '—'}
                  </TableCell>
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
                );
              })}
            {!isLoading && !data?.length && (
              <TableRow>
                <TableCell colSpan={5}>
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
        <TextField
          {...register('prazo', {
            setValueAs: (v: string) => (v ? new Date(v).toISOString() : v),
          })}
          label="Prazo de entrega"
          type="datetime-local"
          error={!!errors.prazo}
          helperText={errors.prazo?.message ?? 'Depois desse prazo o aluno não consegue mais enviar'}
          fullWidth
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <Box>
          <Button component="label" size="small" variant="outlined" startIcon={<AttachFileIcon />}>
            {anexo ? anexo.name : editando?.arquivoUrl ? 'Trocar anexo' : 'Anexar arquivo (opcional)'}
            <input
              type="file"
              hidden
              onChange={(e) => setAnexo(e.target.files?.[0] ?? null)}
            />
          </Button>
        </Box>
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
