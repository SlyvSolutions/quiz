import { el } from './dom';
import { criarIcone } from './icone';

export interface OpcoesBotao {
  seta?: boolean;
  grande?: boolean;
}

export function criarBotaoPill(
  texto: string,
  variante: 'primaria' | 'secundaria' = 'primaria',
  opcoes: OpcoesBotao = {}
): HTMLButtonElement {
  const classes = ['btn-pill', `btn-${variante}`];
  if (opcoes.grande) classes.push('btn-grande');
  const btn = el('button', { class: classes.join(' '), attrs: { type: 'button' } }, texto);
  if (opcoes.seta) btn.appendChild(criarIcone('seta'));
  return btn;
}

/** Botão pequeno para dentro de cards (Ler resumo, Escolher, Subir, Descer). */
export function criarBotaoCartao(texto: string, extra = ''): HTMLButtonElement {
  return el('button', { class: `btn-cartao ${extra}`.trim(), attrs: { type: 'button' } }, texto);
}

/** Botão de texto sublinhado, para ações discretas. */
export function criarBotaoTexto(texto: string, extra = ''): HTMLButtonElement {
  return el('button', { class: `btn-texto ${extra}`.trim(), attrs: { type: 'button' } }, texto);
}
