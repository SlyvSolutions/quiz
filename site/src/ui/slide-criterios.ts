import { el } from './dom';
import { criarIcone, type NomeIcone } from './icone';
import { criarBlocoConcretude } from './selo-concretude';
import type { AvaliacaoPublica } from '../core/votos';
import { mascararTexto } from '../core/mascarar-texto';

/** O veredito nunca depende só de cor: cada um tem texto e ícone, iguais para os cinco candidatos. */
export const ICONE_VEREDITO: Record<string, NomeIcone> = {
  Viável: 'check',
  'Viável com condições': 'check',
  Parcial: 'meio',
  Difícil: 'nao',
  'Inviável nos termos propostos': 'nao',
  'Sem base para avaliar': 'duvida',
};

export interface CriterioInfo {
  id: string;
  nome: string;
}

export interface OpcoesSlideCriterios {
  /**
   * true só no Resultado, onde o autor já foi revelado: a justificativa sai literal. Por padrão (verso do card do quiz,
   * antes do Resultado) a justificativa passa pela máscara única (nomes, programas e autorreferência).
   */
  original?: boolean;
}

/**
 * Os 5 critérios do trecho escolhido e o selo de concretude do trecho.
 * Não recebe nem mostra autor, partido ou apelido. A fonte da avaliação nunca é exibida aqui: o nome do arquivo
 * do plano e o nome de programas na URL revelariam o autor durante o quiz (a fonte aparece só no Comparador).
 */
export function criarSlideCriterios(
  avaliacoes: AvaliacaoPublica[],
  criterios: CriterioInfo[],
  opcoes: OpcoesSlideCriterios = {}
): HTMLElement {
  const raiz = el('section', { class: 'slide-criterios', attrs: { 'aria-label': 'Critérios do trecho escolhido' } });
  if (avaliacoes.length === 0) {
    raiz.append(el('p', { class: 'slide-criterios-vazio', texto: 'Ainda não há avaliação publicada para este trecho.' }));
    return raiz;
  }

  const nomes = new Map(criterios.map((c) => [c.id, c.nome]));
  const lista = el('div', { class: 'slide-criterios-lista' });
  [...avaliacoes]
    .sort((a, b) => a.criterio_id.localeCompare(b.criterio_id))
    .forEach((a) => {
      const badge = el(
        'span',
        { class: 'slide-criterios-badge' },
        criarIcone(ICONE_VEREDITO[a.veredito] ?? 'duvida', 'icone-pequeno'),
        a.veredito
      );
      lista.append(
        el(
          'div',
          { class: 'slide-criterios-item' },
          el(
            'div',
            { class: 'slide-criterios-topo' },
            el('span', { class: 'slide-criterios-nome', texto: `${a.criterio_id} · ${nomes.get(a.criterio_id) ?? ''}` }),
            badge
          ),
          el('p', { class: 'slide-criterios-just', texto: opcoes.original ? a.justificativa : mascararTexto(a.justificativa) })
        )
      );
    });

  raiz.append(
    lista,
    el('div', { class: 'slide-criterios-selos' }, criarBlocoConcretude(avaliacoes))
  );
  return raiz;
}
