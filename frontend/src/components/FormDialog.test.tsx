import { fireEvent, render, screen } from '@testing-library/react';
import { FormDialog } from './FormDialog';

describe('FormDialog', () => {
  it('fecha direto quando não há alterações no formulário (isDirty=false)', () => {
    const onClose = vi.fn();
    render(
      <FormDialog
        open
        title="Nova matéria"
        onClose={onClose}
        onSubmit={vi.fn()}
        submitLabel="Salvar"
        isDirty={false}
      >
        <div>conteúdo do formulário</div>
      </FormDialog>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('pede confirmação antes de fechar quando há alterações não salvas (isDirty=true)', () => {
    const onClose = vi.fn();
    render(
      <FormDialog
        open
        title="Nova matéria"
        onClose={onClose}
        onSubmit={vi.fn()}
        submitLabel="Salvar"
        isDirty
      >
        <div>conteúdo do formulário</div>
      </FormDialog>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    // Ainda não fechou — o diálogo de confirmação de descarte apareceu no lugar.
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByText('Descartar alterações?')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Descartar' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('chama onSubmit ao submeter o formulário e exibe a mensagem de erro quando informada', () => {
    const onSubmit = vi.fn();
    render(
      <FormDialog
        open
        title="Nova matéria"
        onClose={vi.fn()}
        onSubmit={onSubmit}
        submitLabel="Salvar"
        error="Já existe uma matéria com esse nome"
      >
        <div>conteúdo do formulário</div>
      </FormDialog>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Já existe uma matéria com esse nome');

    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
