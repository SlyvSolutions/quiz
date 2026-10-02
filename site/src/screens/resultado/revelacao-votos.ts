import { el } from '../../ui/dom';
import { abrirSlidePanel } from '../../ui/slide-panel';
import { criarSlideCriterios, type CriterioInfo } from '../../ui/slide-criterios';
import { NOTA_CONCRETUDE } from '../../ui/selo-concretude';
import type { VotoRevelado } from '../../core/votos';

export const TITULO_PAINEL_VOTOS = 'Seus votos, um a um';

/**
 * A grande revelação: voto a voto, quem era o autor de cada trecho escolhido no quiz,
 * o texto literal e o que os 5 critérios dizem sobre ele (com o selo de concretude). Fica dentro do
 * painel deslizante aberto pelo botão "Ver voto a voto" do Resultado (autor revelado: trecho e justificativas saem literais, sem máscara): lista simples, que rola no
 * próprio painel e cresce sem custo especial (uma linha por voto, sem pedaços escondidos).
 */
export function criarRevelacaoVotos(
  votos: VotoRevelado[],
  criterios: CriterioInfo[],
  nomes: Record<string, { nome: string; partido: string }>
): HTMLElement {
  const raiz = el(
    'section',
    { class: 'res-revelacao', attrs: { 'aria-label': TITULO_PAINEL_VOTOS } },
    el('p', { class: 'lead', texto: 'Agora você vê de quem era cada trecho que escolheu e o que os critérios dizem sobre ele.' }),
    el('p', {
      class: 'res-concretude-nota',
      texto: `${NOTA_CONCRETUDE} Cada concretude vale por si, sem ranking.`,
    })
  );

  if (votos.length === 0) {
    raiz.append(el('p', { texto: 'Nenhum voto para mostrar.' }));
    return raiz;
  }

  votos.forEach((v, i) => {
    const quem = nomes[v.candidatoId];
    raiz.append(
      el(
        'article',
        { class: 'res-revelacao-voto' },
        el('p', { class: 'eyebrow', texto: `Voto ${i + 1} · ${v.subtemaNome}` }),
        el('h4', { texto: v.enunciado }),
        el('p', { class: 'res-revelacao-quem', texto: quem ? `${quem.nome} · ${quem.partido}` : v.candidatoId }),
        el('blockquote', { class: 'res-revelacao-texto', texto: v.textoLiteral }),
        criarSlideCriterios(v.avaliacoes, criterios, { original: true })
      )
    );
  });
  return raiz;
}

/** Abre o painel deslizante com todos os votos da sessão. Fecha com Esc, botão Fechar ou toque fora. */
export function abrirPainelVotos(
  votos: VotoRevelado[],
  criterios: CriterioInfo[],
  nomes: Record<string, { nome: string; partido: string }>
) {
  return abrirSlidePanel(TITULO_PAINEL_VOTOS, criarRevelacaoVotos(votos, criterios, nomes));
}
