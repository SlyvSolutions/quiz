import { el } from './dom';

export function criarCard(conteudo: HTMLElement | string, extra = ''): HTMLElement {
  return el('div', { class: `ui-card ${extra}`.trim() }, conteudo);
}
