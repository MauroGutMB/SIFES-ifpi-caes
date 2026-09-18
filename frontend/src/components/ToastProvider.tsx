import { createContext, useContext, useState, type ReactNode } from 'react';
import { Alert, Snackbar } from '@mui/material';

interface ToastContextValue {
  success: (mensagem: string) => void;
  error: (mensagem: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/** Feedback global de sucesso/erro (Snackbar) — chamado após mutações via useToast(). */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<{ mensagem: string; severidade: 'success' | 'error' } | null>(
    null,
  );

  const mostrar = (mensagem: string, severidade: 'success' | 'error') =>
    setEstado({ mensagem, severidade });

  return (
    <ToastContext.Provider
      value={{
        success: (mensagem) => mostrar(mensagem, 'success'),
        error: (mensagem) => mostrar(mensagem, 'error'),
      }}
    >
      {children}
      <Snackbar
        open={!!estado}
        autoHideDuration={4000}
        onClose={() => setEstado(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setEstado(null)}
          severity={estado?.severidade}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {estado?.mensagem}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast precisa estar dentro de um ToastProvider');
  return ctx;
}
