import { el } from './dom';
import { criarIcone } from './icone';

const ATRASO_REMOCAO = 400; // ms: cobre --mq-dur-saida com folga

export interface SlidePanelOptions {
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

export function abrirSlidePanel(titulo: string, conteudo: HTMLElement | string, options?: SlidePanelOptions) {
  const anterior = document.activeElement as HTMLElement | null;

  const backdrop = el('div', { class: 'ui-slide-panel-backdrop' });

  const btnClose = el('button', {
    class: 'ui-slide-close',
    attrs: { type: 'button', 'aria-label': 'Fechar' },
  });
  btnClose.appendChild(criarIcone('fechar'));

  const headerControls = el('div', { class: 'ui-slide-controls' }, btnClose);
  const titleEl = el('h3', { texto: titulo });
  const contentEl = el('div', { class: 'ui-slide-content' }, conteudo);

  const panel = el(
    'div',
    { class: 'ui-slide-panel', attrs: { role: 'dialog', 'aria-modal': 'true', 'aria-label': titulo } },
    el('div', { class: 'ui-slide-header' }, titleEl, headerControls),
    contentEl
  );

  let currentFooter: HTMLElement | null = null;

  const renderFooter = (opts?: SlidePanelOptions) => {
    if (currentFooter) {
      currentFooter.remove();
      currentFooter = null;
    }
    if (opts && (opts.onPrev || opts.onNext)) {
      currentFooter = el('div', { class: 'ui-slide-footer mobile-action-bar' });
      
      if (opts.onPrev) {
        const btnPrev = el('button', { class: 'btn-pill btn-secundaria' }, el('span', { texto: 'Anterior' }));
        if (opts.hasPrev === false) btnPrev.setAttribute('disabled', 'true');
        btnPrev.addEventListener('click', () => opts.onPrev!());
        currentFooter.appendChild(btnPrev);
      }
      
      if (opts.onNext) {
        const btnNext = el('button', { class: 'btn-pill btn-primaria' }, el('span', { texto: 'Próximo' }));
        if (opts.hasNext === false) btnNext.setAttribute('disabled', 'true');
        btnNext.addEventListener('click', () => opts.onNext!());
        currentFooter.appendChild(btnNext);
      }
      
      panel.appendChild(currentFooter);
    }
  };

  renderFooter(options);

  document.body.appendChild(backdrop);
  document.body.appendChild(panel);
  document.body.style.overflow = 'hidden';

  // Reflow para iniciar a transição
  requestAnimationFrame(() => {
    backdrop.classList.add('open');
    panel.classList.add('open');
    btnClose.focus();
  });

  const keyHandler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') fechar();
  };

  function fechar() {
    document.removeEventListener('keydown', keyHandler);
    backdrop.classList.remove('open');
    panel.classList.remove('open');
    setTimeout(() => {
      backdrop.remove();
      panel.remove();
      document.body.style.overflow = '';
      anterior?.focus();
    }, ATRASO_REMOCAO);
  }

  function update(novoTitulo: string, novoConteudo: HTMLElement | string, novasOpcoes?: SlidePanelOptions) {
    titleEl.textContent = novoTitulo;
    panel.setAttribute('aria-label', novoTitulo);
    contentEl.replaceChildren(novoConteudo);
    renderFooter(novasOpcoes);
    contentEl.scrollTop = 0;
  }

  btnClose.addEventListener('click', fechar);
  backdrop.addEventListener('click', fechar);
  document.addEventListener('keydown', keyHandler);

  return { panel, fechar, update };
}
