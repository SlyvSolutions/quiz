import { el } from './dom';
import { criarIcone } from './icone';

const DURACAO = 6000; // ms na tela
const SAIDA = 400; // ms, cobre a transição de saída

/** Aviso curto e não bloqueante ("por que não posso abrir isso agora"). Anunciado por leitor de tela (role=status). */
export function mostrarAviso(texto: string): void {
  document.querySelectorAll('.toast').forEach((t) => t.remove());
  const toast = el('div', { class: 'toast', attrs: { role: 'status' } }, criarIcone('cadeado'), el('span', { texto }));
  document.body.appendChild(toast);
  requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('entrou')));
  setTimeout(() => {
    toast.classList.remove('entrou');
    setTimeout(() => toast.remove(), SAIDA);
  }, DURACAO);
}
