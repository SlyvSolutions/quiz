import { el } from './dom';

/** Avatar neutro: inicial ou número do plano. Sem foto até haver fonte oficial e autorizada. */
export function criarAvatarNeutro(apelido: string): HTMLElement {
  const inicial = apelido.split(' ').pop()?.charAt(0) || '?';
  return el('div', {
    class: 'ui-avatar',
    texto: inicial,
    attrs: { 'aria-label': `Avatar neutro para ${apelido}`, role: 'img' },
  });
}
