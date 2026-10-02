import { el } from './dom';
import { criarOnca } from './logo';
import { cobertura, type Cobertura, type VereditoCriterio } from '../core/cobertura';

/** Selo de concretude: pill preto com onça, "N de 5" e 5 barrinhas (uma cheia por critério avaliado). */
export function criarSeloConcretude(cob: Cobertura): HTMLElement {
  const barras = el('span', { class: 'selo-concretude-barras', attrs: { 'aria-hidden': 'true' } });
  for (let i = 0; i < cob.total; i++) {
    barras.appendChild(el('span', { class: `selo-concretude-barra${i < cob.avaliados ? ' cheia' : ''}` }));
  }
  return el(
    'span',
    { class: 'selo-concretude', attrs: { 'aria-label': `Concretude da proposta: ${cob.avaliados} de ${cob.total} critérios avaliados` } },
    criarOnca('Onça-pintada do Missão'),
    el('span', { texto: `CONCRETUDE ${cob.avaliados} de ${cob.total}` }),
    barras
  );
}

/** Legenda única da concretude, igual no Comparador e no painel de votos. */
export const NOTA_CONCRETUDE =
  'Concretude mostra quantos dos 5 critérios deu para avaliar com fonte (por exemplo, “3 de 5”). Quanto mais critérios dá para checar, mais concreta é a proposta: ela diz como, quanto, com que base e até quando. Concretude não mede se a ideia é boa nem se vai dar certo: o veredito de cada critério mostra isso, um a um.';

/** Concretude de um trecho, igual em todas as telas: o selo "N de 5". Lista vazia mostra só o texto neutro. */
export function criarBlocoConcretude(avaliacoes: VereditoCriterio[]): HTMLElement {
  const bloco = el('div', { class: 'concretude-bloco' });
  if (avaliacoes.length === 0) {
    bloco.append(el('span', { class: 'concretude-vazio', texto: 'Sem avaliação carregada' }));
    return bloco;
  }
  bloco.append(criarSeloConcretude(cobertura(avaliacoes)));
  return bloco;
}
