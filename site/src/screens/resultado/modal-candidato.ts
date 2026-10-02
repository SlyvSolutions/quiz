import { el } from '../../ui/dom';
import { abrirModal } from '../../ui/modal';
import { criarSeloConcretude } from '../../ui/selo-concretude';
import { cobertura, type VereditoCriterio } from '../../core/cobertura';
import type { ConcretudeCandidato } from '../../core/concretude';

export interface PropostaDoModal {
  rotulo: string;
  texto: string;
  avaliacoes: VereditoCriterio[];
}

/** Modal do candidato no Resultado: concretude dos planos (%) e as propostas, cada uma com o selo "N de 5". */
export function abrirModalCandidato(nome: string, concretude: ConcretudeCandidato, propostas: PropostaDoModal[]) {
  const lista = el('div', { class: 'modal-cand-lista' });
  propostas.forEach((p) => {
    lista.append(
      el(
        'article',
        { class: 'modal-cand-proposta' },
        el('span', { class: 'eyebrow', texto: p.rotulo }),
        el('p', { class: 'modal-cand-texto', texto: p.texto }),
        criarSeloConcretude(cobertura(p.avaliacoes))
      )
    );
  });
  const conteudo = el(
    'div',
    { class: 'modal-cand' },
    el('h3', { texto: nome }),
    el('p', {
      class: 'modal-cand-pct',
      texto: `Concretude dos planos: ${concretude.percentual}% (${concretude.trechos} propostas avaliadas)`,
    }),
    el('p', {
      class: 'modal-cand-nota',
      texto:
        'Concretude é quantos dos 5 critérios deu para avaliar com fonte, em média nas propostas deste candidato. Ela não mede se a ideia é boa nem se vai dar certo.',
    }),
    lista
  );
  return abrirModal(conteudo);
}
