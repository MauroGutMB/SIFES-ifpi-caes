import { useState } from 'react';
import { Button, Stack, Typography } from '@mui/material';
import DownloadIcon from '@mui/icons-material/DownloadOutlined';
import { axiosInstance } from '../../../api/axios-instance';

interface RelatoriosTabProps {
  materiaId: string;
}

async function baixarRelatorio(url: string, nomeArquivo: string) {
  const resposta = await axiosInstance.get(url, { responseType: 'blob' });
  const objectUrl = URL.createObjectURL(resposta.data as Blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = nomeArquivo;
  link.click();
  URL.revokeObjectURL(objectUrl);
}

export function RelatoriosTab({ materiaId }: RelatoriosTabProps) {
  const [baixando, setBaixando] = useState<string | null>(null);

  const baixar = async (chave: string, url: string, nomeArquivo: string) => {
    setBaixando(chave);
    try {
      await baixarRelatorio(url, nomeArquivo);
    } finally {
      setBaixando(null);
    }
  };

  return (
    <Stack spacing={3}>
      <div>
        <Typography variant="h6" gutterBottom>
          Diário de classe
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            disabled={baixando === 'diario-pdf'}
            onClick={() =>
              baixar('diario-pdf', `/relatorios/diario/${materiaId}?formato=pdf`, 'diario.pdf')
            }
          >
            PDF
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            disabled={baixando === 'diario-xlsx'}
            onClick={() =>
              baixar('diario-xlsx', `/relatorios/diario/${materiaId}?formato=xlsx`, 'diario.xlsx')
            }
          >
            Excel
          </Button>
        </Stack>
      </div>

      <div>
        <Typography variant="h6" gutterBottom>
          Frequência da matéria
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            disabled={baixando === 'freq-pdf'}
            onClick={() =>
              baixar(
                'freq-pdf',
                `/relatorios/frequencia-materia/${materiaId}?formato=pdf`,
                'frequencia.pdf',
              )
            }
          >
            PDF
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            disabled={baixando === 'freq-xlsx'}
            onClick={() =>
              baixar(
                'freq-xlsx',
                `/relatorios/frequencia-materia/${materiaId}?formato=xlsx`,
                'frequencia.xlsx',
              )
            }
          >
            Excel
          </Button>
        </Stack>
      </div>
    </Stack>
  );
}
