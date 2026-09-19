import { fireEvent, render, screen } from '@testing-library/react';
import { ToastProvider, useToast } from './ToastProvider';

function BotoesDeTeste() {
  const toast = useToast();
  return (
    <>
      <button onClick={() => toast.success('Aluno salvo com sucesso')}>disparar sucesso</button>
      <button onClick={() => toast.error('Falha ao salvar aluno')}>disparar erro</button>
    </>
  );
}

describe('ToastProvider', () => {
  it('exibe uma mensagem de sucesso com a severidade correta ao chamar toast.success', async () => {
    render(
      <ToastProvider>
        <BotoesDeTeste />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByText('disparar sucesso'));

    await screen.findByText('Aluno salvo com sucesso');
    expect(screen.getByTestId('SuccessOutlinedIcon')).toBeInTheDocument();
  });

  it('exibe uma mensagem de erro com a severidade correta ao chamar toast.error', async () => {
    render(
      <ToastProvider>
        <BotoesDeTeste />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByText('disparar erro'));

    await screen.findByText('Falha ao salvar aluno');
    expect(screen.getByTestId('ErrorOutlineIcon')).toBeInTheDocument();
  });

  it('useToast lança erro quando usado fora do ToastProvider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<BotoesDeTeste />)).toThrow(
      'useToast precisa estar dentro de um ToastProvider',
    );
    consoleError.mockRestore();
  });

  it('não mostra nenhum alerta antes de qualquer toast ser disparado', () => {
    render(
      <ToastProvider>
        <BotoesDeTeste />
      </ToastProvider>,
    );

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
