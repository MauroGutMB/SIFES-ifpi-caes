import { fireEvent, render, screen } from '@testing-library/react';
import { ConfirmDialog } from './ConfirmDialog';

describe('ConfirmDialog', () => {
  it('não renderiza o conteúdo quando fechado', () => {
    render(
      <ConfirmDialog
        open={false}
        title="Excluir aluno"
        description="Essa ação não pode ser desfeita."
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.queryByText('Excluir aluno')).not.toBeInTheDocument();
  });

  it('chama onConfirm ao clicar no botão de confirmação, quando não exige valor digitado', () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        open
        title="Excluir aluno"
        description="Essa ação não pode ser desfeita."
        confirmLabel="Excluir"
        onConfirm={onConfirm}
        onClose={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('bloqueia a confirmação até o usuário digitar o confirmValue exigido', () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog
        open
        title="Excluir aluno com histórico"
        description="Digite o nome do aluno para confirmar."
        confirmLabel="Excluir"
        confirmValue="Maria Silva"
        onConfirm={onConfirm}
        onClose={vi.fn()}
      />,
    );

    const botaoConfirmar = screen.getByRole('button', { name: 'Excluir' });
    expect(botaoConfirmar).toBeDisabled();

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Maria Silva' } });
    expect(botaoConfirmar).toBeEnabled();

    fireEvent.click(botaoConfirmar);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('chama onClose ao clicar em Cancelar', () => {
    const onClose = vi.fn();
    render(
      <ConfirmDialog
        open
        title="Excluir aluno"
        description="Essa ação não pode ser desfeita."
        onConfirm={vi.fn()}
        onClose={onClose}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
