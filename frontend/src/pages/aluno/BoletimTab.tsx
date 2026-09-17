import { useState } from 'react';
import { Button, Stack, Typography } from '@mui/material';
import DownloadIcon from '@mui/icons-material/DownloadOutlined';
import { axiosInstance } from '../../api/axios-instance';

interface BoletimTabProps {
  alunoId: string;
}

async function baixar(url: string, nomeArquivo: string) {
  const resposta = await axiosInstance.get(url, { responseType: 'blob' });
  const objectUrl = URL.createObjectURL(resposta.data as Blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = nomeArquivo;
  link.click();
  URL.revokeObjectURL(objectUrl);
}

export function BoletimTab({ alunoId }: BoletimTabProps) {
  const [baixando, setBaixando] = useState<string | null>(null);

  const baixarComEstado = async (chave: string, url: string, nomeArquivo: string) => {
    setBaixando(chave);
    try {
      await baixar(url, nomeArquivo);
    } finally {
      setBaixando(null);
    }
  };

  return (
    <>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Para o detalhamento por item de cada matéria, acesse a matéria em "Minhas matérias".
      </Typography>
      <Stack direction="row" spacing={1}>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          disabled={baixando === 'pdf'}
          onClick={() =>
            baixarComEstado('pdf', `/relatorios/boletim/${alunoId}?formato=pdf`, 'boletim.pdf')
          }
        >
          PDF
        </Button>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          disabled={baixando === 'xlsx'}
          onClick={() =>
            baixarComEstado('xlsx', `/relatorios/boletim/${alunoId}?formato=xlsx`, 'boletim.xlsx')
          }
        >
          Excel
        </Button>
      </Stack>
    </>
  );
}
