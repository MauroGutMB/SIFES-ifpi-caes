import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  MenuItem,
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
import WarningAmberIcon from '@mui/icons-material/WarningAmberOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutlineOutlined';
import UploadIcon from '@mui/icons-material/UploadFileOutlined';
import { isAxiosError } from 'axios';
import { useQueryClient } from '@tanstack/react-query';
import {
  getAulasControllerFindOneQueryKey,
  useAulasControllerFindOne,
  useAulasControllerSetFrequencias,
  useAulasControllerUpdate,
} from '../../../api/generated/aulas/aulas';
import {
  getMateriaisAulaControllerListarQueryKey,
  useMateriaisAulaControllerCriar,
  useMateriaisAulaControllerListar,
  useMaterialAulaItemControllerRemover,
} from '../../../api/generated/materiais-aula/materiais-aula';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { urlArquivo } from '../../../api/arquivo-url';
import { tokens } from '../../../theme/tokens';

interface AulaDialogProps {
  aulaId: string | null;
  onClose: () => void;
}

const STATUS_OPCOES = [
  { value: 'PRESENTE', label: 'Presente' },
  { value: 'FALTA', label: 'Falta' },
  { value: 'FALTA_JUSTIFICADA', label: 'Falta justificada' },
] as const;

type StatusFrequencia = (typeof STATUS_OPCOES)[number]['value'];

export function AulaDialog({ aulaId, onClose }: AulaDialogProps) {
  const queryClient = useQueryClient();
  const { data: aula, isLoading } = useAulasControllerFindOne(aulaId ?? '', {
    query: { enabled: !!aulaId },
  });
  const { data: materiais } = useMateriaisAulaControllerListar(aulaId ?? '', {
    query: { enabled: !!aulaId },
  });
  const atualizarAula = useAulasControllerUpdate();
  const setFrequencias = useAulasControllerSetFrequencias();
  const criarMaterial = useMateriaisAulaControllerCriar();
  const removerMaterial = useMaterialAulaItemControllerRemover();

  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [frequencias, setFrequenciasLocal] = useState<Record<string, StatusFrequencia>>({});
  const [novoMaterialTitulo, setNovoMaterialTitulo] = useState('');
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [materialParaExcluir, setMaterialParaExcluir] = useState<{ id: string; titulo: string } | null>(
    null,
  );

  useEffect(() => {
    if (aula) {
      setTitulo(aula.titulo ?? '');
      setDescricao(aula.descricao ?? '');
      setFrequenciasLocal(
        Object.fromEntries(aula.frequencias.map((f) => [f.alunoId, f.status])),
      );
    }
  }, [aula]);

  const invalidarAula = () =>
    aulaId &&
    queryClient.invalidateQueries({ queryKey: getAulasControllerFindOneQueryKey(aulaId) });

  const salvarAula = async () => {
    if (!aulaId) return;
    setErro(null);
    try {
      await atualizarAula.mutateAsync({ id: aulaId, data: { titulo, descricao } });
      await invalidarAula();
    } catch (error) {
      setErro(
        isAxiosError(error)
          ? ((error.response?.data as { message?: string } | undefined)?.message ??
            'Não foi possível salvar')
          : 'Não foi possível salvar',
      );
    }
  };

  const salvarFrequencias = async () => {
    if (!aulaId) return;
    setErro(null);
    try {
      await setFrequencias.mutateAsync({
        id: aulaId,
        data: {
          frequencias: Object.entries(frequencias).map(([alunoId, status]) => ({
            alunoId,
            status,
          })),
        },
      });
      await invalidarAula();
    } catch (error) {
      setErro(
        isAxiosError(error)
          ? ((error.response?.data as { message?: string } | undefined)?.message ??
            'Não foi possível salvar a frequência')
          : 'Não foi possível salvar a frequência',
      );
    }
  };

  const enviarMaterial = async () => {
    if (!aulaId || !arquivo || !novoMaterialTitulo) return;
    setErro(null);
    try {
      await criarMaterial.mutateAsync({
        aulaId,
        data: { titulo: novoMaterialTitulo, arquivo },
      });
      setNovoMaterialTitulo('');
      setArquivo(null);
      await queryClient.invalidateQueries({
        queryKey: getMateriaisAulaControllerListarQueryKey(aulaId),
      });
    } catch (error) {
      setErro(
        isAxiosError(error)
          ? ((error.response?.data as { message?: string } | undefined)?.message ??
            'Não foi possível enviar o material')
          : 'Não foi possível enviar o material',
      );
    }
  };

  const excluirMaterial = async () => {
    if (!materialParaExcluir) return;
    await removerMaterial.mutateAsync({ id: materialParaExcluir.id });
    if (aulaId) {
      await queryClient.invalidateQueries({
        queryKey: getMateriaisAulaControllerListarQueryKey(aulaId),
      });
    }
    setMaterialParaExcluir(null);
  };

  return (
    <Dialog open={!!aulaId} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        Aula {aula ? new Date(aula.data).toLocaleDateString('pt-BR') : ''}
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, overflowX: 'auto' }}>
        {isLoading || !aula ? (
          <Typography color="text.secondary">Carregando…</Typography>
        ) : (
          <>
            <Stack direction="row" spacing={2}>
              <TextField
                label="Título"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                fullWidth
              />
            </Stack>
            <TextField
              label="Descrição"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              multiline
              minRows={2}
              fullWidth
            />
            <Box>
              <Button
                variant="outlined"
                size="small"
                onClick={salvarAula}
                disabled={atualizarAula.isPending}
                startIcon={
                  atualizarAula.isPending ? <CircularProgress size={14} color="inherit" /> : undefined
                }
              >
                {atualizarAula.isPending ? 'Salvando…' : 'Salvar título/descrição'}
              </Button>
            </Box>

            <Divider />

            <Typography variant="subtitle1">Frequência</Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Aluno</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {aula.frequencias.map((f) => (
                  <TableRow key={f.alunoId}>
                    <TableCell>{f.aluno.nome}</TableCell>
                    <TableCell>
                      <TextField
                        select
                        size="small"
                        value={frequencias[f.alunoId] ?? f.status}
                        onChange={(e) =>
                          setFrequenciasLocal((atual) => ({
                            ...atual,
                            [f.alunoId]: e.target.value as StatusFrequencia,
                          }))
                        }
                        sx={{ minWidth: 180 }}
                      >
                        {STATUS_OPCOES.map((op) => (
                          <MenuItem key={op.value} value={op.value}>
                            {op.label}
                          </MenuItem>
                        ))}
                      </TextField>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {aula.frequencias.length > 0 && (
              <Box>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={salvarFrequencias}
                  disabled={setFrequencias.isPending}
                  startIcon={
                    setFrequencias.isPending ? <CircularProgress size={14} color="inherit" /> : undefined
                  }
                >
                  {setFrequencias.isPending ? 'Salvando…' : 'Salvar frequência'}
                </Button>
              </Box>
            )}
            {aula.frequencias.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                Nenhum aluno vinculado a esta disciplina ainda.
              </Typography>
            )}

            <Divider />

            <Typography variant="subtitle1">Material de aula</Typography>
            <Stack spacing={1}>
              {(materiais ?? []).map((material) => (
                <Stack
                  key={material.id}
                  direction="row"
                  sx={{ alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <Typography variant="body2">
                    <a href={urlArquivo(material.arquivoUrl)} target="_blank" rel="noreferrer">
                      {material.titulo}
                    </a>
                  </Typography>
                  <Tooltip title="Excluir material">
                    <IconButton
                      size="small"
                      aria-label={`Excluir material "${material.titulo}"`}
                      onClick={() => setMaterialParaExcluir({ id: material.id, titulo: material.titulo })}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              ))}
              {!materiais?.length && (
                <Typography variant="body2" color="text.secondary">
                  Nenhum material enviado.
                </Typography>
              )}
            </Stack>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <TextField
                label="Título do material"
                size="small"
                value={novoMaterialTitulo}
                onChange={(e) => setNovoMaterialTitulo(e.target.value)}
              />
              <Button component="label" size="small" variant="outlined">
                {arquivo ? arquivo.name : 'Escolher arquivo'}
                <input
                  type="file"
                  hidden
                  onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
                />
              </Button>
              <Tooltip title="Enviar material">
                <span>
                  <IconButton
                    color="primary"
                    aria-label="Enviar material"
                    onClick={enviarMaterial}
                    disabled={!arquivo || !novoMaterialTitulo || criarMaterial.isPending}
                  >
                    {criarMaterial.isPending ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <UploadIcon />
                    )}
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>

            {erro && (
              <Box
                role="alert"
                sx={{
                  display: 'flex',
                  gap: 1.25,
                  alignItems: 'flex-start',
                  p: '12px 14px',
                  bgcolor: tokens.redBg,
                  border: `1px solid ${tokens.red}`,
                  borderRadius: 1,
                }}
              >
                <WarningAmberIcon sx={{ color: tokens.redText, fontSize: 18, mt: '1px' }} />
                <Typography sx={{ fontSize: 13, color: tokens.redText, lineHeight: 1.5 }}>
                  {erro}
                </Typography>
              </Box>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Fechar</Button>
      </DialogActions>

      <ConfirmDialog
        open={!!materialParaExcluir}
        title="Excluir material?"
        description={`Tem certeza que deseja excluir "${materialParaExcluir?.titulo}"? Isso não pode ser desfeito.`}
        confirmLabel="Excluir material"
        confirmColor="error"
        loading={removerMaterial.isPending}
        onConfirm={excluirMaterial}
        onClose={() => setMaterialParaExcluir(null)}
      />
    </Dialog>
  );
}
