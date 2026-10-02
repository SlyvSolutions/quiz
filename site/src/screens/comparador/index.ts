import { criarBotaoPill } from '../../ui/botao';
import { criarAvisoFalhaCandidatos } from '../../ui/aviso';
import { carregarCandidatos, type NomesCandidatos } from '../../data/candidatos';
import { criarIcone, type NomeIcone } from '../../ui/icone';
import { el } from '../../ui/dom';
import { criarBlocoConcretude, NOTA_CONCRETUDE } from '../../ui/selo-concretude';
import { criarContextoRecolhivel } from '../../ui/contexto';
import { navigate } from '../../app/router';

interface Trecho {
  id: string;
  candidato_id: string;
  eixo: string;
  arquivo: string;
  texto_literal: string;
  contexto_literal?: string;
  contexto_linha_inicio?: number;
  contexto_linha_fim?: number;
}

interface Avaliacao {
  trecho_id: string;
  criterio_id: string;
  veredito: string;
  justificativa: string;
  fonte: string;
  /** O outro lado da avaliação, vindo da pesquisa publicada (chave do JSON: outro_lado). */
  outro_lado?: string;
}


/** O veredito nunca depende só de cor: cada um tem texto e ícone, iguais para os cinco candidatos. */
const ICONE_VEREDITO: Record<string, NomeIcone> = {
  Viável: 'check',
  'Viável com condições': 'check',
  Parcial: 'meio',
  Difícil: 'nao',
  'Inviável nos termos propostos': 'nao',
  'Sem base para avaliar': 'duvida',
};

/** A fonte vira link só quando é um endereço web; norma, arquivo e linha ficam como texto. */
function criarFonteAvaliacao(fonte: string): HTMLElement {
  const rotulo = `Fonte: ${fonte}`;
  if (/^https?:\/\//.test(fonte)) {
    return el('a', { class: 'comp-av-fonte', texto: rotulo, attrs: { href: fonte, target: '_blank', rel: 'noopener' } });
  }
  return el('p', { class: 'comp-av-fonte', texto: rotulo });
}

function criarPainelViabilidade(avaliacoes: Avaliacao[]): HTMLElement {
  const lista = el('div', { class: 'comp-av-lista' });
  avaliacoes.forEach((av) => {
    const badge = el('span', { class: 'comp-av-badge' }, criarIcone(ICONE_VEREDITO[av.veredito] ?? 'duvida', 'icone-pequeno'), av.veredito);
    lista.appendChild(
      el(
        'div',
        { class: 'comp-av-item' },
        el('div', { class: 'comp-av-topo' }, el('span', { class: 'comp-av-crit', texto: `${av.criterio_id}:` }), badge),
        el('p', { class: 'comp-av-just', texto: av.justificativa }),
        av.fonte ? criarFonteAvaliacao(av.fonte) : null,
        av.outro_lado
          ? el(
              'details',
              { class: 'comp-av-outro-lado' },
              el('summary', { texto: 'Outro lado' }),
              el('p', { class: 'comp-av-outro-texto', texto: av.outro_lado })
            )
          : null
      )
    );
  });


  return el(
    'details',
    { class: 'comp-avaliacoes' },
    el('summary', {}, criarIcone('busca'), 'Painel de Viabilidade', criarIcone('seta')),
    criarBlocoConcretude(avaliacoes),
    el('p', { class: 'comp-concretude-nota', texto: NOTA_CONCRETUDE }),
    lista
  );
}

export async function renderComparador(): Promise<HTMLElement> {
  const container = el('div', { class: 'screen-comparador tela' });

  let NOME_CANDIDATOS: NomesCandidatos;
  try {
    NOME_CANDIDATOS = await carregarCandidatos();
  } catch (e) {
    console.error(e);
    container.appendChild(el('div', { class: 'conteudo tela-topo' }, criarAvisoFalhaCandidatos()));
    return container;
  }

  container.appendChild(
    el(
      'header',
      { class: 'tela-topo comp-main-header' },
      el(
        'div',
        { class: 'conteudo' },
        el('p', { class: 'eyebrow', texto: 'Todos os candidatos, mesma régua' }),
        el('h2', { texto: 'Comparador Completo' }),
        el('p', {
          class: 'lead',
          texto: 'Todos os trechos extraídos dos planos de governo depositados no TSE, classificados por eixo.',
        })
      )
    )
  );

  let trechos: Trecho[] = [];
  try {
    const res = await fetch(import.meta.env.BASE_URL + 'data/trechos.json');
    if (res.ok) trechos = await res.json();
  } catch (e) {
    console.error(e);
  }

  // Agrupar por eixo
  const porEixo: Record<string, Trecho[]> = {};
  trechos.forEach((t) => {
    (porEixo[t.eixo] ??= []).push(t);
  });

  let avaliacoes: Avaliacao[] = [];
  try {
    const resAv = await fetch(import.meta.env.BASE_URL + 'data/avaliacoes.json');
    if (resAv.ok) avaliacoes = await resAv.json();
  } catch (e) {
    console.error(e);
  }

  const listContainer = el('div', { class: 'conteudo comp-list-container' });

  Object.entries(porEixo).forEach(([eixo, tList]) => {
    const grid = el('div', { class: 'comp-grid' });

    tList.forEach((t) => {
      const info = NOME_CANDIDATOS[t.candidato_id];
      const avaliacoesDoTrecho = avaliacoes.filter((a) => a.trecho_id === t.id);

      grid.appendChild(
        el(
          'article',
          { class: 'comp-trecho-card' },
          el('div', { class: 'comp-cand-tag chip chip-marca', texto: info ? info.nome : t.candidato_id }),
          el('blockquote', { class: 'comp-literal', texto: `"${t.texto_literal}"` }),
          t.contexto_literal
            ? criarContextoRecolhivel(
                'Ver o parágrafo completo',
                t.contexto_literal,
                t.texto_literal,
                `${t.arquivo} · linhas ${t.contexto_linha_inicio} a ${t.contexto_linha_fim}`
              )
            : null,
          avaliacoesDoTrecho.length > 0 ? criarPainelViabilidade(avaliacoesDoTrecho) : null,
          el('a', {
            class: 'comp-fonte',
            texto: `Fonte: TSE (${t.arquivo})`,
            attrs: { href: 'https://divulgacandcontas.tse.jus.br', target: '_blank', rel: 'noopener' },
          })
        )
      );
    });

    listContainer.appendChild(
      el(
        'section',
        { class: 'comp-eixo-section' },
        el(
          'div',
          { class: 'comp-eixo-titulo' },
          el('span', { class: 'eyebrow', texto: 'Eixo' }),
          el('h3', { texto: eixo })
        ),
        grid
      )
    );
  });

  container.appendChild(listContainer);

  const btnVoltar = criarBotaoPill('Voltar ao Início', 'secundaria');
  btnVoltar.addEventListener('click', () => navigate('#inicio'));
  container.appendChild(el('div', { class: 'conteudo comp-footer-actions', data: { fixo: '' } }, btnVoltar));

  return container;
}
