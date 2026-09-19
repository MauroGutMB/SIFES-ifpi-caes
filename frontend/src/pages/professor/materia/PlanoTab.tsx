import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Chip,
  FormControlLabel,
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
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/EditOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutlineOutlined';
import UploadFileIcon from '@mui/icons-material/UploadFileOutlined';
import StarIcon from '@mui/icons-material/Star';
import RuleIcon from '@mui/icons-material/RuleOutlined';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheckOutlined';
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
  useMateriaPlanoControllerConfigurarRegra,
  useMateriaPlanoControllerCriarItem,
  useMateriaPlanoControllerDetalhamentoAluno,
  useMateriaPlanoControllerListarItens,
} from '../../../api/generated/plano-disciplina/plano-disciplina';
import { getMateriasControllerFindAllQueryKey } from '../../../api/generated/materias/materias';
import {
  useItensAvaliacaoControllerAplicarAbaixoMedia,
  useItensAvaliacaoControllerAtualizar,
  useItensAvaliacaoControllerDefinirItemEspecialAluno,
  useItensAvaliacaoControllerRemover,
  useItensAvaliacaoControllerSetNotas,
} from '../../../api/generated/plano-disciplina/plano-disciplina';
import { MateriaPlanoControllerCriarItemBody } from '../../../api/generated/zod/plano-disciplina/plano-disciplina';
import type { BoletimLinhaDto, ItemAvaliacaoDto } from '../../../api/generated/models';
import { FormDialog } from '../../../components/FormDialog';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { useToast } from '../../../components/ToastProvider';
import { tokens } from '../../../theme/tokens';
import { corMedia } from '../../../utils/corMedia';

type FormValues = z.infer<typeof MateriaPlanoControllerCriarItemBody>;

const LABEL_SITUACAO: Record<string, string> = {
  CURSANDO: 'Cursando',
  APROVADO: 'Aprovado',
  REPROVADO: 'Reprovado',
};

interface PlanoTabProps {
  materiaId: string;
  materiaAberta: boolean;
  notaMinimaAprovacao: string;
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
  const definirItemEspecial = useItensAvaliacaoControllerDefinirItemEspecialAluno();
  const [valores, setValores] = useState<Record<string, string>>({});
  const [habilitados, setHabilitados] = useState<Record<string, boolean>>({});
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (itens) {
      setValores(
        Object.fromEntries(
          itens.map((item) => [item.id, item.notaLancada ? item.valorObtido : '']),
        ),
      );
      setHabilitados(
        Object.fromEntries(itens.map((item) => [item.id, item.habilitadoParaAluno])),
      );
    }
  }, [itens]);

  const salvar = async () => {
    if (!aluno || !itens) return;
    setErro(null);
    try {
      await Promise.all([
        ...itens.map((item) =>
          setNotas.mutateAsync({
            id: item.id,
            data: { notas: [{ alunoId: aluno.id, valorObtido: Number(valores[item.id]) || 0 }] },
          }),
        ),
        ...itens
          .filter((item) => item.especial)
          .map((item) =>
            definirItemEspecial.mutateAsync({
              id: item.id,
              alunoId: aluno.id,
              data: { habilitado: !!habilitados[item.id] },
            }),
          ),
      ]);
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
      submitting={setNotas.isPending || definirItemEspecial.isPending}
      submitLabel="Salvar notas"
    >
      {isLoading || !itens ? (
        <Typography color="text.secondary">Carregando…</Typography>
      ) : itens.length === 0 ? (
        <Typography color="text.secondary">Nenhum item de avaliação cadastrado ainda.</Typography>
      ) : (
        itens.map((item) => (
          <Stack key={item.id} spacing={0.5}>
            <TextField
              label={`${item.nome} (máx. ${item.valorMaximo})`}
              placeholder="Não lançado"
              type="number"
              size="small"
              fullWidth
              disabled={item.especial && !habilitados[item.id]}
              value={valores[item.id] ?? ''}
              onChange={(e) => setValores((atual) => ({ ...atual, [item.id]: e.target.value }))}
            />
            {item.especial && (
              <FormControlLabel
                sx={{ ml: 0 }}
                control={
                  <Checkbox
                    size="small"
                    checked={!!habilitados[item.id]}
                    onChange={(e) =>
                      setHabilitados((atual) => ({ ...atual, [item.id]: e.target.checked }))
                    }
                  />
                }
                label={`Este item vale para ${aluno?.nome ?? 'o aluno'}`}
              />
            )}
          </Stack>
        ))
      )}
    </FormDialog>
  );
}

interface ConfigItem {
  peso: string;
  modoEspecial: '' | 'PONDERADA' | 'SUBSTITUI_ITEM' | 'SUBSTITUI_MEDIA';
  itemSubstituidoId: string;
}

interface RegraAprovacaoDialogProps {
  materiaId: string;
  itens: ItemAvaliacaoDto[];
  notaMinimaAprovacao: string;
  open: boolean;
  onClose: () => void;
  onSalvo: () => void;
}

function RegraAprovacaoDialog({
  materiaId,
  itens,
  notaMinimaAprovacao,
  open,
  onClose,
  onSalvo,
}: RegraAprovacaoDialogProps) {
  const configurar = useMateriaPlanoControllerConfigurarRegra();
  const [config, setConfig] = useState<Record<string, ConfigItem>>({});
  const [notaMinima, setNotaMinima] = useState(notaMinimaAprovacao);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setConfig(
        Object.fromEntries(
          itens.map((item) => [
            item.id,
            {
              peso: item.peso,
              modoEspecial: item.modoEspecial ?? '',
              itemSubstituidoId: item.itemSubstituidoId ?? '',
            },
          ]),
        ),
      );
      setNotaMinima(notaMinimaAprovacao);
      setErro(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const itensNormais = itens.filter((item) => !item.especial);

  const salvar = async () => {
    setErro(null);
    try {
      await configurar.mutateAsync({
        materiaId,
        data: {
          notaMinimaAprovacao: Number(notaMinima) || 7,
          itens: itens.map((item) => {
            const c = config[item.id];
            return {
              itemAvaliacaoId: item.id,
              peso: Number(c.peso) || 0,
              modoEspecial: item.especial && c.modoEspecial ? c.modoEspecial : undefined,
              itemSubstituidoId:
                item.especial && c.modoEspecial === 'SUBSTITUI_ITEM' && c.itemSubstituidoId
                  ? c.itemSubstituidoId
                  : undefined,
            };
          }),
        },
      });
      onSalvo();
    } catch (error) {
      setErro(
        isAxiosError(error)
          ? ((error.response?.data as { message?: string } | undefined)?.message ??
            'Não foi possível salvar a regra')
          : 'Não foi possível salvar a regra',
      );
    }
  };

  return (
    <FormDialog
      open={open}
      title="Regra de aprovação"
      subtitle="Defina o peso de cada item na média e, para itens especiais, como eles entram na nota final."
      onClose={onClose}
      onSubmit={salvar}
      error={erro}
      submitting={configurar.isPending}
      submitLabel="Salvar regra"
      width={560}
    >
      <TextField
        label="Nota mínima para aprovação"
        type="number"
        size="small"
        value={notaMinima}
        onChange={(e) => setNotaMinima(e.target.value)}
        helperText="Média que o aluno precisa atingir na disciplina pra ser aprovado. Também é a nota mínima que um item especial precisa atingir pra valer na nota. Padrão: 7."
        sx={{ mb: 1 }}
      />

      {itens.length === 0 && (
        <Typography color="text.secondary">Nenhum item de avaliação cadastrado ainda.</Typography>
      )}
      {itens.map((item) => {
        const c = config[item.id];
        if (!c) return null;
        return (
          <Stack
            key={item.id}
            spacing={1}
            sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
          >
            <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
              {item.especial && <StarIcon fontSize="small" sx={{ color: tokens.yellow }} />}
              <Typography variant="subtitle2">{item.nome}</Typography>
            </Stack>
            <TextField
              label="Peso"
              type="number"
              size="small"
              value={c.peso}
              onChange={(e) =>
                setConfig((atual) => ({
                  ...atual,
                  [item.id]: { ...atual[item.id], peso: e.target.value },
                }))
              }
            />
            {item.especial && (
              <>
                <TextField
                  select
                  label="Como conta na nota final"
                  size="small"
                  value={c.modoEspecial}
                  onChange={(e) =>
                    setConfig((atual) => ({
                      ...atual,
                      [item.id]: {
                        ...atual[item.id],
                        modoEspecial: e.target.value as ConfigItem['modoEspecial'],
                      },
                    }))
                  }
                >
                  <MenuItem value="PONDERADA">Entra na média ponderada (N nota)</MenuItem>
                  <MenuItem value="SUBSTITUI_ITEM">Substitui a nota de um item</MenuItem>
                  <MenuItem value="SUBSTITUI_MEDIA">Substitui a média inteira</MenuItem>
                </TextField>
                {c.modoEspecial === 'SUBSTITUI_ITEM' && (
                  <TextField
                    select
                    label="Item substituído"
                    size="small"
                    value={c.itemSubstituidoId}
                    onChange={(e) =>
                      setConfig((atual) => ({
                        ...atual,
                        [item.id]: { ...atual[item.id], itemSubstituidoId: e.target.value },
                      }))
                    }
                  >
                    {itensNormais.map((normal) => (
                      <MenuItem key={normal.id} value={normal.id}>
                        {normal.nome}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              </>
            )}
          </Stack>
        );
      })}
    </FormDialog>
  );
}

export function PlanoTab({
  materiaId,
  materiaAberta,
  notaMinimaAprovacao,
}: PlanoTabProps) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { data: itens, isLoading } = useMateriaPlanoControllerListarItens(materiaId);
  const { data: boletim, isLoading: carregandoBoletim } =
    useMateriaPlanoControllerBoletim(materiaId);
  const criar = useMateriaPlanoControllerCriarItem();
  const atualizar = useItensAvaliacaoControllerAtualizar();
  const remover = useItensAvaliacaoControllerRemover();
  const setNotas = useItensAvaliacaoControllerSetNotas();
  const aplicarAbaixoMedia = useItensAvaliacaoControllerAplicarAbaixoMedia();

  const [editando, setEditando] = useState<ItemAvaliacaoDto | null>(null);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [paraExcluir, setParaExcluir] = useState<ItemAvaliacaoDto | null>(null);
  const [paraNotas, setParaNotas] = useState<ItemAvaliacaoDto | null>(null);
  const [notasEditadas, setNotasEditadas] = useState<Record<string, string>>({});
  const [aplicarAbaixoMediaAberto, setAplicarAbaixoMediaAberto] = useState(false);
  const [itemParaAplicar, setItemParaAplicar] = useState('');
  const [alunoParaEditarNotas, setAlunoParaEditarNotas] = useState<BoletimLinhaDto['aluno'] | null>(
    null,
  );
  const [erro, setErro] = useState<string | null>(null);
  const [regraDialogAberto, setRegraDialogAberto] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(MateriaPlanoControllerCriarItemBody) });
  const criandoEspecial = watch('especial');

  const invalidarItens = () =>
    queryClient.invalidateQueries({
      queryKey: getMateriaPlanoControllerListarItensQueryKey(materiaId),
    });

  const abrirNovo = (especial: boolean) => {
    setEditando(null);
    reset({ nome: '', valorMaximo: 10, especial });
    setErro(null);
    setDialogAberto(true);
  };

  const abrirEdicao = (item: ItemAvaliacaoDto) => {
    setEditando(item);
    reset({ nome: item.nome, valorMaximo: Number(item.valorMaximo), especial: item.especial });
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

  // Só entram os que já têm modo definido na Regra de aprovação — sem isso o backend rejeita
  // habilitar o item pra qualquer aluno, então nem faz sentido oferecer no seletor.
  const itensEspeciaisConfigurados = (itens ?? []).filter(
    (item) => item.especial && item.modoEspecial,
  );

  const abrirAplicarAbaixoMedia = () => {
    setItemParaAplicar(itensEspeciaisConfigurados[0]?.id ?? '');
    setErro(null);
    setAplicarAbaixoMediaAberto(true);
  };

  const salvarAplicarAbaixoMedia = async () => {
    if (!itemParaAplicar) return;
    setErro(null);
    try {
      const resultado = await aplicarAbaixoMedia.mutateAsync({ id: itemParaAplicar });
      await queryClient.invalidateQueries({
        queryKey: getMateriaPlanoControllerBoletimQueryKey(materiaId),
      });
      setAplicarAbaixoMediaAberto(false);
      toast.success(
        resultado.alunosHabilitados > 0
          ? `Item habilitado para ${resultado.alunosHabilitados} aluno(s) abaixo da média`
          : 'Nenhum aluno está abaixo da média no momento',
      );
    } catch (error) {
      setErro(
        isAxiosError(error)
          ? ((error.response?.data as { message?: string } | undefined)?.message ??
            'Não foi possível aplicar o item')
          : 'Não foi possível aplicar o item',
      );
    }
  };

  return (
    <>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Itens de avaliação</Typography>
        {materiaAberta && (
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<RuleIcon fontSize="small" />}
              onClick={() => setRegraDialogAberto(true)}
              sx={{ '& .MuiButton-startIcon': { mr: 0.5 } }}
            >
              Regra de aprovação
            </Button>
            <Tooltip title="Item especial (recuperação, prova final) — só vale pros alunos habilitados individualmente">
              <Button
                variant="contained"
                startIcon={<StarIcon fontSize="small" />}
                onClick={() => abrirNovo(true)}
                sx={{
                  bgcolor: tokens.yellow,
                  color: tokens.yellowText,
                  '&:hover': { bgcolor: tokens.yellow, opacity: 0.85 },
                  '& .MuiButton-startIcon': { mr: 0.5 },
                }}
              >
                Novo item especial
              </Button>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<AddIcon fontSize="small" />}
              onClick={() => abrirNovo(false)}
              sx={{ '& .MuiButton-startIcon': { mr: 0.5 } }}
            >
              Novo item
            </Button>
          </Stack>
        )}
      </Box>

      <Paper variant="outlined" sx={{ mb: 3, overflowX: 'auto' }}>
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
                  <TableCell>
                    <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                      {item.especial && (
                        <Tooltip title="Item especial">
                          <StarIcon fontSize="small" sx={{ color: tokens.yellow }} />
                        </Tooltip>
                      )}
                      <span>{item.nome}</span>
                      {item.especial && !item.modoEspecial && (
                        <Tooltip title="Configure como esse item conta na nota antes de habilitá-lo pra algum aluno">
                          <Chip
                            size="small"
                            color="warning"
                            variant="outlined"
                            label="Modo não configurado"
                          />
                        </Tooltip>
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell>{item.valorMaximo}</TableCell>
                  <TableCell>
                    <Stack direction="row">
                      <Tooltip title="Lançar notas">
                        <IconButton size="small" onClick={() => abrirNotas(item)}>
                          <UploadFileIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {materiaAberta && (
                        <>
                          <Tooltip title="Editar item">
                            <IconButton
                              size="small"
                              aria-label="Editar item"
                              onClick={() => abrirEdicao(item)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Excluir item">
                            <IconButton
                              size="small"
                              aria-label="Excluir item"
                              onClick={() => setParaExcluir(item)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
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

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6">Boletim</Typography>
        {materiaAberta && itensEspeciaisConfigurados.length > 0 && (
          <Button
            variant="outlined"
            startIcon={<PlaylistAddCheckIcon fontSize="small" />}
            onClick={abrirAplicarAbaixoMedia}
            sx={{ '& .MuiButton-startIcon': { mr: 0.5 } }}
          >
            Aplicar item especial
          </Button>
        )}
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        <Box component="span" sx={{ color: tokens.blueText, fontWeight: 600 }}>Azul</Box> = falta
        lançar alguma nota (média parcial) · <Box component="span" sx={{ color: tokens.green, fontWeight: 600 }}>verde</Box> = aprovado ·{' '}
        <Box component="span" sx={{ color: tokens.redText, fontWeight: 600 }}>vermelho</Box> = abaixo da média
      </Typography>
      <Paper variant="outlined" sx={{ overflowX: 'auto' }}>
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
                  <TableCell>
                    <Tooltip title={linha.notaParcial ? 'Nota parcial — falta lançar alguma nota' : ''}>
                      <Box
                        component="span"
                        sx={{
                          color: corMedia(
                            linha.notaFinal,
                            linha.notaParcial,
                            Number(notaMinimaAprovacao),
                          ),
                          fontWeight: 600,
                        }}
                      >
                        {linha.notaFinal.toFixed(1)}
                      </Box>
                    </Tooltip>
                  </TableCell>
                  <TableCell>{linha.frequenciaPercentual.toFixed(0)}%</TableCell>
                  <TableCell>{LABEL_SITUACAO[linha.situacao]}</TableCell>
                  <TableCell>
                    <Tooltip title="Editar notas do aluno">
                      <IconButton
                        size="small"
                        aria-label="Editar notas do aluno"
                        onClick={() => setAlunoParaEditarNotas(linha.aluno)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </Paper>

      <FormDialog
        open={dialogAberto}
        title={
          editando
            ? 'Editar item'
            : criandoEspecial
              ? 'Novo item especial'
              : 'Novo item de avaliação'
        }
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

      <FormDialog
        open={aplicarAbaixoMediaAberto}
        title="Aplicar item especial"
        subtitle="Habilita o item escolhido para todos os alunos cuja média atual está abaixo da nota mínima de aprovação."
        onClose={() => setAplicarAbaixoMediaAberto(false)}
        onSubmit={salvarAplicarAbaixoMedia}
        error={erro}
        submitting={aplicarAbaixoMedia.isPending}
        submitLabel="Aplicar"
      >
        <TextField
          select
          label="Item especial"
          size="small"
          fullWidth
          value={itemParaAplicar}
          onChange={(e) => setItemParaAplicar(e.target.value)}
        >
          {itensEspeciaisConfigurados.map((item) => (
            <MenuItem key={item.id} value={item.id}>
              {item.nome}
            </MenuItem>
          ))}
        </TextField>
        <Typography variant="body2" color="text.secondary">
          Nota mínima de aprovação da disciplina: {notaMinimaAprovacao}
        </Typography>
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

      <RegraAprovacaoDialog
        materiaId={materiaId}
        itens={itens ?? []}
        notaMinimaAprovacao={notaMinimaAprovacao}
        open={regraDialogAberto}
        onClose={() => setRegraDialogAberto(false)}
        onSalvo={async () => {
          await invalidarItens();
          await queryClient.invalidateQueries({
            queryKey: getMateriaPlanoControllerBoletimQueryKey(materiaId),
          });
          await queryClient.invalidateQueries({
            queryKey: getMateriasControllerFindAllQueryKey(),
          });
          setRegraDialogAberto(false);
        }}
      />
    </>
  );
}
