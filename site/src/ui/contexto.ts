import { el } from './dom';
import { criarIcone } from './icone';

/** Um parágrafo curto e sem ponto final é o título da seção do plano ("3. Proteger a vida ..."). */
function ehTitulo(p: string): boolean {
  return p.length <= 110 && !/[.!?:;"”)]$/.test(p);
}

/**
 * Transforma o contexto (parágrafos separados por linha em branco) em elementos, com o trecho em destaque.
 * O contexto é literal do plano; o destaque só mostra qual frase o teste usa.
 */
export function paragrafosDoContexto(contexto: string, trecho: string): HTMLElement[] {
  const paragrafos = contexto.split(/\n\n/).map((p) => p.trim()).filter(Boolean);
  return paragrafos.map((p, i) => {
    if (i === 0 && paragrafos.length > 1 && ehTitulo(p)) {
      return el('p', { class: 'contexto-titulo', texto: p });
    }
    const pos = trecho ? p.indexOf(trecho) : -1;
    if (pos < 0) return el('p', { class: 'citacao', texto: p });
    return el(
      'p',
      { class: 'citacao' },
      p.slice(0, pos),
      el('mark', { class: 'trecho-destaque', texto: trecho }),
      p.slice(pos + trecho.length)
    );
  });
}

/** "Ver o parágrafo completo": recolhido por padrão, para quem quer decidir com mais contexto. */
export function criarContextoRecolhivel(
  rotulo: string,
  contexto: string,
  trecho: string,
  rodape?: string
): HTMLElement {
  return el(
    'details',
    { class: 'contexto' },
    el('summary', {}, criarIcone('busca'), rotulo, criarIcone('seta')),
    el(
      'div',
      { class: 'contexto-corpo' },
      ...paragrafosDoContexto(contexto, trecho),
      rodape ? el('p', { class: 'contexto-fonte', texto: rodape }) : null
    )
  );
}
