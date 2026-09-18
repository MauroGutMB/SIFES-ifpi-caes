import { useState } from 'react';
import { Avatar, type AvatarProps, Dialog, DialogContent, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/CloseOutlined';

/** Avatar clicável que abre a própria foto em tamanho original num popup, em vez de navegar
 * pra URL crua da API (isso expunha o endpoint de arquivos como se fosse um link de navegação
 * normal). Usado em toda foto de perfil do app — professor, aluno, ou pendente de aprovação. */
export function FotoPopup({ src, sx, ...props }: AvatarProps) {
  const [aberta, setAberta] = useState(false);

  return (
    <>
      <Avatar
        src={src}
        onClick={
          src
            ? (event) => {
                // Precisa parar a propagação: em várias telas essa foto fica dentro de um
                // elemento clicável maior (ex: CardActionArea que navega pra outra página) —
                // sem isso, clicar na foto pra ver o popup também dispara a navegação do pai.
                event.stopPropagation();
                setAberta(true);
              }
            : undefined
        }
        sx={{ cursor: src ? 'pointer' : undefined, ...sx }}
        {...props}
      />
      {src && (
        <Dialog open={aberta} onClose={() => setAberta(false)} maxWidth="md">
          <IconButton
            onClick={() => setAberta(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              bgcolor: 'rgba(0,0,0,0.5)',
              color: '#fff',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
            }}
          >
            <CloseIcon />
          </IconButton>
          <DialogContent sx={{ p: 0, lineHeight: 0 }}>
            <img
              src={src}
              alt=""
              style={{ display: 'block', maxWidth: '90vw', maxHeight: '85vh' }}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
