import { el } from './dom';
import { criarIcone } from './icone';

export function abrirModal(conteudo: HTMLElement | string) {
  const anterior = document.activeElement as HTMLElement | null;

  const btnClose = el('button', {
    class: 'ui-modal-close',
    attrs: { type: 'button', 'aria-label': 'Fechar' },
  });
  btnClose.appendChild(criarIcone('fechar'));

  const dialog = el(
    'dialog',
    { class: 'ui-modal', attrs: { role: 'dialog', 'aria-modal': 'true' } },
    el('div', { class: 'ui-modal-content' }, conteudo),
    btnClose
  );
  document.body.appendChild(dialog);
  document.body.style.overflow = 'hidden';

  const fechar = () => {
    dialog.close();
    dialog.remove();
    document.body.style.overflow = '';
    anterior?.focus();
  };

  btnClose.addEventListener('click', fechar);
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) fechar();
  });
  dialog.addEventListener('cancel', (e) => {
    e.preventDefault();
    fechar();
  });

  dialog.showModal();
  btnClose.focus();
  return { dialog, fechar };
}
