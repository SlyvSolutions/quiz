import { el } from './dom';
import { criarIcone } from './icone';

export const AVISO_AUTORIA = 'Ferramenta idealizada e desenvolvida por apoiadores do Partido Missão';

/** Bloco de aviso com ícone. O sentido vem do texto, nunca só do ícone ou da cor. */
export function criarAviso(titulo: string | null, ...paragrafos: string[]): HTMLElement {
  return el(
    'div',
    { class: 'aviso', attrs: { role: 'note' } },
    criarIcone('aviso'),
    el(
      'div',
      { class: 'aviso-texto' },
      titulo ? el('strong', { texto: titulo }) : null,
      ...paragrafos.map((p) => el('p', { texto: p }))
    )
  );
}

/** Mostrado quando data/candidatos.json não carrega: as telas não têm nomes de reserva. */
export function criarAvisoFalhaCandidatos(): HTMLElement {
  return criarAviso('Não foi possível carregar os candidatos agora.', 'Tente recarregar a página.');
}
