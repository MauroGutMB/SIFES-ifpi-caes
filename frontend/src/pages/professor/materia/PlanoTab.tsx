import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  IconButton,
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
import GradeIcon from '@mui/icons-material/GradeOutlined';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { isAxiosError } from 'axios';
import { useQueryClient } from '@tanstack/react-query';
import {
  getMateriaPlanoControllerBoletimQueryKey,
  getMateriaPlanoControllerDetalhamentoAlunoQueryKey,
  getMateriaPlanoControllerListarItensQueryKey,
  useMateriaPlanoControllerBoletim,
  useMateriaPlanoControllerCriarItem,
  useMateriaPlanoControllerDetalhamentoAluno,
  useMateriaPlanoControllerListarItens,
} from '../../../api/generated/plano-disciplina/plano-disciplina';
import {
  useItensAvaliacaoControllerAtualizar,
  useItensAvaliacaoControllerRemover,
  useItensAvaliacaoControllerSetNotas,
} from '../../../api/generated/plano-disciplina/plano-disciplina';
import { MateriaPlanoControllerCriarItemBody } from '../../../api/generated/zod/plano-disciplina/plano-disciplina';
import type { BoletimLinhaDto, ItemAvaliacaoDto } from '../../../api/generated/models';
import { FormDialog } from '../../../components/FormDialog';
import { ConfirmDialog } from '../../../components/ConfirmDialog';

type FormValues = z.infer<typeof MateriaPlanoControllerCriarItemBody>;

const LABEL_SITUACAO: Record<string, string> = {
  CURSANDO: 'Cursando',
  APROVADO: 'Aprovado',
  REPROVADO: 'Reprovado',
};

interface PlanoTabProps {
  materiaId: string;
  materiaAberta: boolean;
}

interface EditarNotasAlunoDialogProps {
  materiaId: string;
  aluno: BoletimLinhaDto['aluno'] | null;
  onClose: () => void;
  onSalvo: () => void;
}

function EditarNotasAlunoDialog({
  materiaId,
  aluno,
  onClose,
  onSalvo,
}: EditarNotasAlunoDialogProps) {
  const { data: itens, isLoading } = useMateriaPlanoControllerDetalhamentoAluno(
    materiaId,
    aluno?.id ?? '',
    { query: { enabled: !!aluno } },
  );
  const setNotas = useItensAvaliacaoControllerSetNotas();
  const [valores, setValores] = useState<Record<string, string>>({});
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (itens) {
      setValores(Object.fromEntries(itens.map((item) => [item.id, item.valorObtido])));
    }
  }, [itens]);

  const salvar = async () => {
    if (!aluno || !itens) return;
    setErro(null);
    try {
      await Promise.all(
        itens.map((item) =>
          setNotas.mutateAsync({
            id: item.id,
            data: { notas: [{ alunoId: aluno.id, valorObtido: Number(valores[item.id]) || 0 }] },
          }),
        ),
      );
      onSalvo();
    } catch (error) {
      setErro(
        isAxiosError(error)
          ? ((error.response?.data as { message?: string } | undefined)?.message ??
            'Não foi possível salvar as notas')
          : 'Não foi possível salvar as notas',
      );
    }
  };

  return (
    <FormDialog
      open={!!aluno}
      title={`Editar notas — ${aluno?.nome ?? ''}`}
      onClose={onClose}
      onSubmit={salvar}
      error={erro}
      submitting={setNotas.isPending}
      submitLabel="Salvar notas"
    >
      {isLoading || !itens ? (
        <Typography color="text.secondary">Carregando…</Typography>
      ) : itens.length === 0 ? (
        <Typography color="text.secondary">Nenhum item de avaliação cadastrado ainda.</Typography>
      ) : (
        itens.map((item) => (
          <TextField
            key={item.id}
            label={`${item.nome} (máx. ${item.valorMaximo})`}
            type="number"
            size="small"
            fullWidth
            value={valores[item.id] ?? ''}
            onChange={(e) => setValores((atual) => ({ ...atual, [item.id]: e.target.value }))}
          />
        ))
      )}
    </FormDialog>
  );
}

export function PlanoTab({ materiaId, materiaAberta }: PlanoTabProps) {
  const queryClient = useQueryClient();
  const { data: itens, isLoading } = useMateriaPlanoControllerListarItens(materiaId);
  const { data: boletim, isLoading: carregandoBoletim } =
    useMateriaPlanoControllerBoletim(materiaId);
  const criar = useMateriaPlanoControllerCriarItem();
  const atualizar = useItensAvaliacaoControllerAtualizar();
  const remover = useItensAvaliacaoControllerRemover();
  const setNotas = useItensAvaliacaoControllerSetNotas();

  const [editando, setEditando] = useState<ItemAvaliacaoDto | null>(null);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [paraExcluir, setParaExcluir] = useState<ItemAvaliacaoDto | null>(null);
  const [paraNotas, setParaNotas] = useState<ItemAvaliacaoDto | null>(null);
  const [notasEditadas, setNotasEditadas] = useState<Record<string, string>>({});
  const [alunoParaEditarNotas, setAlunoParaEditarNotas] = useState<BoletimLinhaDto['aluno'] | null>(
    null,
  );
  const [erro, setErro] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(MateriaPlanoControllerCriarItemBody) });

  const invalidarItens = () =>
    queryClient.invalidateQueries({
      queryKey: getMateriaPlanoControllerListarItensQueryKey(materiaId),
    });

  const abrirNovo = () => {
    setEditando(null);
    reset({ nome: '', valorMaximo: 10 });
    setErro(null);
    setDialogAberto(true);
  };

  const abrirEdicao = (item: ItemAvaliacaoDto) => {
    setEditando(item);
    reset({ nome: item.nome, valorMaximo: Number(item.valorMaximo) });
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
      await invalidarItens();
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
    await invalidarItens();
    setParaExcluir(null);
  };

  const abrirNotas = (item: ItemAvaliacaoDto) => {
    setParaNotas(item);
    setNotasEditadas({});
    setErro(null);
  };

  const salvarNotas = async () => {
    if (!paraNotas) return;
    setErro(null);
    try {
      await setNotas.mutateAsync({
        id: paraNotas.id,
        data: {
          notas: Object.entries(notasEditadas).map(([alunoId, valor]) => ({
            alunoId,
            valorObtido: Number(valor) || 0,
          })),
        },
      });
      await queryClient.invalidateQueries({
        queryKey: getMateriaPlanoControllerBoletimQueryKey(materiaId),
      });
      setParaNotas(null);
    } catch (error) {
      setErro(
        isAxiosError(error)
          ? ((error.response?.data as { message?: string } | undefined)?.message ??
            'Não foi possível salvar as notas')
          : 'Não foi possível salvar as notas',
      );
    }
  };

  return (
    <>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Itens de avaliação</Typography>
        {materiaAberta && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={abrirNovo}>
            Novo item
          </Button>
        )}
      </Box>

      <Paper variant="outlined" sx={{ mb: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>Valor máximo</TableCell>
              <TableCell width={140} />
            </TableRow>
          </TableHead>
          <TableBody>
            {!isLoading &&
              (itens ?? []).map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.nome}</TableCell>
                  <TableCell>{item.valorMaximo}</TableCell>
                  <TableCell>
                    <Stack direction="row">
                      <IconButton size="small" onClick={() => abrirNotas(item)}>
                        <GradeIcon fontSize="small" />
                      </IconButton>
                      {materiaAberta && (
                        <>
                          <IconButton size="small" onClick={() => abrirEdicao(item)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={() => setParaExcluir(item)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            {!isLoading && !itens?.length && (
              <TableRow>
                <TableCell colSpan={3}>
                  <Typography color="text.secondary" variant="body2">
                    Nenhum item de avaliação cadastrado.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      <Typography variant="h6" sx={{ mb: 1 }}>
        Boletim
      </Typography>
      <Paper variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Aluno</TableCell>
              <TableCell>Matrícula</TableCell>
              <TableCell>Média</TableCell>
              <TableCell>Frequência</TableCell>
              <TableCell>Situação</TableCell>
              <TableCell width={60} />
            </TableRow>
          </TableHead>
          <TableBody>
            {!carregandoBoletim &&
              (boletim ?? []).map((linha) => (
                <TableRow key={linha.aluno.id}>
                  <TableCell>{linha.aluno.nome}</TableCell>
                  <TableCell>{linha.aluno.matricula}</TableCell>
                  <TableCell>{linha.notaFinal.toFixed(1)}</TableCell>
                  <TableCell>{linha.frequenciaPercentual.toFixed(0)}%</TableCell>
                  <TableCell>{LABEL_SITUACAO[linha.situacao]}</TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => setAlunoParaEditarNotas(linha.aluno)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </Paper>

      <FormDialog
        open={dialogAberto}
        title={editando ? 'Editar item' : 'Novo item de avaliação'}
        submitLabel={editando ? 'Salvar item' : 'Criar item'}
        onClose={() => setDialogAberto(false)}
        onSubmit={salvar}
        error={erro}
        submitting={criar.isPending || atualizar.isPending}
      >
        <TextField
          {...register('nome')}
          label="Nome"
          error={!!errors.nome}
          helperText={errors.nome?.message}
          fullWidth
          autoFocus
        />
        <TextField
          {...register('valorMaximo', { valueAsNumber: true })}
          label="Valor máximo"
          type="number"
          error={!!errors.valorMaximo}
          helperText={errors.valorMaximo?.message}
          fullWidth
        />
      </FormDialog>

      <ConfirmDialog
        open={!!paraExcluir}
        title="Excluir item de avaliação"
        description={`Tem certeza que deseja excluir "${paraExcluir?.nome}"? As notas lançadas nele também são removidas.`}
        confirmLabel="Excluir"
        confirmColor="error"
        loading={remover.isPending}
        onConfirm={excluir}
        onClose={() => setParaExcluir(null)}
      />

      <FormDialog
        open={!!paraNotas}
        title={`Lançar notas — ${paraNotas?.nome ?? ''}`}
        onClose={() => setParaNotas(null)}
        onSubmit={salvarNotas}
        error={erro}
        submitting={setNotas.isPending}
        submitLabel="Salvar notas"
      >
        <Typography variant="body2" color="text.secondary">
          Valor máximo: {paraNotas?.valorMaximo}. Alunos sem nota preenchida aqui ficam com 0.
        </Typography>
        {(boletim ?? []).map((linha) => (
          <TextField
            key={linha.aluno.id}
            label={linha.aluno.nome}
            type="number"
            size="small"
            fullWidth
            value={notasEditadas[linha.aluno.id] ?? ''}
            onChange={(e) =>
              setNotasEditadas((atual) => ({ ...atual, [linha.aluno.id]: e.target.value }))
            }
          />
        ))}
      </FormDialog>

      <EditarNotasAlunoDialog
        materiaId={materiaId}
        aluno={alunoParaEditarNotas}
        onClose={() => setAlunoParaEditarNotas(null)}
        onSalvo={async () => {
          await queryClient.invalidateQueries({
            queryKey: getMateriaPlanoControllerBoletimQueryKey(materiaId),
          });
          if (alunoParaEditarNotas) {
            await queryClient.invalidateQueries({
              queryKey: getMateriaPlanoControllerDetalhamentoAlunoQueryKey(
                materiaId,
                alunoParaEditarNotas.id,
              ),
            });
          }
          setAlunoParaEditarNotas(null);
        }}
      />
    </>
  );
}
