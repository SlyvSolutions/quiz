import { criarBotaoPill, criarBotaoCartao } from '../../ui/botao';
import { criarAvatarNeutro } from '../../ui/avatar';
import { el } from '../../ui/dom';
import { animarReordenacao } from '../../motion/flip';
import { paragrafosDoContexto } from '../../ui/contexto';
import { ordemInicialTesteCego } from '../../core/ordem-teste-cego';
import type { Rng } from '../../core/sorteio-quiz';
import { lerSessao, salvarSessao, aplicarOrdemTesteCego } from '../../state/sessao-storage';
import { navigate } from '../../app/router';

interface TrechoCego {
  id: string;
  apelido_neutro: string;
  eixo: string;
  texto_mascarado: string;
  contexto_mascarado?: string;
}

/** Painel com os cinco eixos do plano, cada um com o parágrafo do plano e a frase do teste em destaque. */
function painelDoPlano(trechos: TrechoCego[]): HTMLElement {
  const painel = el('div', { class: 'pilha' });
  trechos.forEach((t) => {
    painel.appendChild(
      el(
        'div',
        { class: 'ui-slide-eixo' },
        el('h4', { texto: t.eixo }),
        ...paragrafosDoContexto(t.contexto_mascarado ?? t.texto_mascarado, t.texto_mascarado)
      )
    );
  });
  return painel;
}

export async function renderTesteCego(rng: Rng = Math.random): Promise<HTMLElement> {
  const container = el('div', { class: 'screen-teste-cego tela' });

  container.appendChild(
    el(
      'header',
      { class: 'tela-topo' },
      el(
        'div',
        { class: 'conteudo' },
        el('p', { class: 'eyebrow', texto: 'Passo 1 · Sem nomes, sem partidos' }),
        el('h2', { texto: 'Teste Cego' }),
        el('p', {
          class: 'lead',
          texto: 'Ordene os planos de governo do que mais gostou (topo) para o que menos gostou (fim).',
        }),
        el(
          'ol',
          { class: 'tc-passos' },
          el('li', { texto: 'Leia os planos em “Opções”. Cada um tem abas por assunto e um resumo completo.' }),
          el('li', { texto: 'Toque em Escolher no plano que você mais gostou: ele vai para o 1º lugar, em “Sua ordem preferida”.' }),
          el('li', { texto: 'Depois escolha o 2º, o 3º e assim por diante, até os 5 estarem na sua ordem.' }),
          el('li', { texto: 'Mudou de ideia? Use Subir e Descer no plano para trocar de posição. Com os 5 ordenados, toque em PRONTO.' })
        )
      )
    )
  );

  // Fetch dados (em um ambiente real, tratamos loading state. Aqui faremos simples)
  let dados: TrechoCego[] = [];
  try {
    const res = await fetch(import.meta.env.BASE_URL + 'data/planos_cegos.json');
    if (res.ok) dados = await res.json();
  } catch (e) {
    console.warn('Falha ao carregar planos cegos', e);
  }

  // Agrupar por candidato
  const candidatosMap = new Map<string, TrechoCego[]>();
  dados.forEach((d) => {
    const lista = candidatosMap.get(d.apelido_neutro) ?? [];
    lista.push(d);
    candidatosMap.set(d.apelido_neutro, lista);
  });

  const candidatos = Array.from(candidatosMap.entries()).map(([apelido_neutro, trechos]) => ({
    apelido_neutro,
    trechos,
  }));

  // Ordem inicial sorteada por sessão (Fisher-Yates, rng injetável) e guardada: F5 mantém, refazer a jornada sorteia de novo
  const sessaoInicial = lerSessao();
  const ordemInicial = ordemInicialTesteCego(
    candidatos.map((c) => c.apelido_neutro),
    sessaoInicial?.ordemInicialCego,
    rng
  );
  if (candidatos.length > 0 && JSON.stringify(sessaoInicial?.ordemInicialCego) !== JSON.stringify(ordemInicial)) {
    const { versao: _v, ...base } = sessaoInicial ?? { versao: 1 as const, ordemCandidatos: [], respostasQuiz: {}, finalizado: false };
    void _v;
    salvarSessao({ ...base, ordemInicialCego: ordemInicial });
  }
  const embaralhados = ordemInicial.map((a) => candidatos.find((c) => c.apelido_neutro === a)!);

  const vazio = el('p', { class: 'tc-vazio', texto: 'Toque em Escolher num plano para começar a sua ordem.' });
  const contagem = el('span', { class: 'tc-contagem', attrs: { 'aria-live': 'polite' } });

  const listDisponiveis = el(
    'section',
    { class: 'tc-list', attrs: { 'aria-label': 'Planos disponíveis' } },
    el(
      'div',
      { class: 'tc-list-topo' },
      el('h3', { texto: 'Opções' }),
      el('p', { texto: 'Leia com calma. Você pode abrir o resumo de cada plano.' })
    )
  );

  const listOrdenados = el(
    'section',
    { class: 'tc-list ranked-list', attrs: { 'aria-label': 'Sua ordem preferida' } },
    el(
      'div',
      { class: 'tc-list-topo' },
      el('h3', { texto: 'Sua Ordem Preferida' }),
      el('p', { texto: 'O primeiro é o que mais gostou.' })
    ),
    vazio
  );

  const rankeados: string[] = [];

  const btnPronto = criarBotaoPill('PRONTO', 'primaria', { seta: true });
  btnPronto.disabled = true;

  const atualizarEstado = () => {
    btnPronto.disabled = rankeados.length !== candidatos.length;
    contagem.textContent = `${rankeados.length} de ${candidatos.length} ordenados`;
    vazio.hidden = rankeados.length > 0;
  };

  const moverCard = (card: HTMLElement, direcao: number) => {
    const parent = card.parentNode;
    if (!parent) return;
    const cards = Array.from(parent.querySelectorAll('.tc-card'));
    const index = cards.indexOf(card);
    if (index < 0) return;

    const novoIndex = index + direcao;
    if (novoIndex < 0 || novoIndex >= cards.length) return;

    const refNode = cards[novoIndex];
    if (!refNode) return;

    animarReordenacao(container, '.tc-card', () => {
      if (direcao === -1) {
        parent.insertBefore(card, refNode);
      } else {
        parent.insertBefore(card, refNode.nextSibling);
      }
    });

    // Atualiza o array lógico
    const candId = card.dataset.id!;
    const idxLogico = rankeados.indexOf(candId);
    rankeados.splice(idxLogico, 1);
    rankeados.splice(idxLogico + direcao, 0, candId);
  };

  const moverParaOrdem = (apelido_neutro: string, card: HTMLElement) => {
    if (rankeados.includes(apelido_neutro)) return;
    rankeados.push(apelido_neutro);

    // O botão de ler resumo permanece; Escolher dá lugar a Subir e Descer
    const actions = card.querySelector('.tc-card-actions') as HTMLElement;
    const resBtn = actions.querySelector('.btn-resumo');

    const btnUp = criarBotaoCartao('Subir');
    btnUp.onclick = (e) => {
      e.stopPropagation();
      moverCard(card, -1);
    };

    const btnDown = criarBotaoCartao('Descer');
    btnDown.onclick = (e) => {
      e.stopPropagation();
      moverCard(card, 1);
    };

    // O card voa da lista de opções para a ordem preferida; os que ficam deslizam para ocupar o lugar
    animarReordenacao(container, '.tc-card', () => {
      listOrdenados.appendChild(card);
      actions.replaceChildren();
      if (resBtn) actions.appendChild(resBtn);
      actions.append(btnUp, btnDown);
      atualizarEstado();
    });
  };

  const cartoes = new Map<string, HTMLElement>();

  embaralhados.forEach((cand, idx) => {
    const nomePlano = `Plano ${idx + 1}`;

    const btnResumo = criarBotaoCartao('Ler plano completo', 'btn-resumo');
    btnResumo.onclick = async () => {
      // Lazy load ui/slide-panel
      const { abrirSlidePanel } = await import('../../ui/slide-panel');
      
      let painelAtual: ReturnType<typeof abrirSlidePanel> | null = null;
      
      const abrirCand = (index: number) => {
        const c = embaralhados[index];
        if (!c) return;
        const plano = `Plano ${index + 1}`;
        const opcoes = {
          onPrev: index > 0 ? () => abrirCand(index - 1) : undefined,
          onNext: index < embaralhados.length - 1 ? () => abrirCand(index + 1) : undefined,
        };
        
        if (painelAtual) {
          painelAtual.update(plano, painelDoPlano(c.trechos), opcoes);
        } else {
          painelAtual = abrirSlidePanel(plano, painelDoPlano(c.trechos), opcoes);
        }
      };
      
      abrirCand(idx);
    };

    // Um eixo de cada vez, com o parágrafo do plano em volta da frase; os cinco eixos ficam à mão
    const passagem = el('div', { class: 'tc-passagem', attrs: { role: 'tabpanel', tabindex: '0' } });
    const abas = el('div', { class: 'tc-eixos', attrs: { role: 'tablist', 'aria-label': `Eixos do ${nomePlano}` } });
    const mostrar = (t: TrechoCego, aba: HTMLElement) => {
      abas.querySelectorAll('.tc-eixo').forEach((a) => a.setAttribute('aria-selected', String(a === aba)));
      passagem.replaceChildren(...paragrafosDoContexto(t.contexto_mascarado ?? t.texto_mascarado, t.texto_mascarado));
    };
    cand.trechos.forEach((t, k) => {
      const aba = el('button', {
        class: 'tc-eixo',
        texto: t.eixo,
        attrs: { type: 'button', role: 'tab', 'aria-selected': String(k === 0) },
      });
      aba.addEventListener('click', () => mostrar(t, aba));
      abas.appendChild(aba);
      if (k === 0) mostrar(t, aba);
    });

    const card = el(
      'div',
      { class: 'tc-card', data: { id: cand.apelido_neutro } },
      criarAvatarNeutro(nomePlano),
      el('div', { class: 'tc-card-content' }, el('strong', { texto: nomePlano }), abas, passagem)
    );

    const btnAdd = criarBotaoCartao('Escolher');
    btnAdd.onclick = () => moverParaOrdem(cand.apelido_neutro, card);

    card.appendChild(el('div', { class: 'tc-card-actions' }, btnResumo, btnAdd));
    listDisponiveis.appendChild(card);
    cartoes.set(cand.apelido_neutro, card);
  });

  // Quem volta para o teste cego reencontra a própria ordem
  for (const apelido of lerSessao()?.ordemCandidatos ?? []) {
    const card = cartoes.get(apelido);
    if (card) moverParaOrdem(apelido, card);
  }

  btnPronto.addEventListener('click', () => {
    // Mudou a ordem ou o quiz já foi concluído: jornada nova (revelação e quiz de novo, com novo sorteio)
    salvarSessao(aplicarOrdemTesteCego(lerSessao(), rankeados));
    navigate('#revelacao'); // próximo passo
  });

  atualizarEstado();

  container.appendChild(
    el(
      'div',
      { class: 'conteudo' },
      el('div', { class: 'tc-lists-container grade grade-larga' }, listDisponiveis, listOrdenados)
    )
  );

  container.appendChild(
    el(
      'div',
      { class: 'tc-footer mobile-action-bar', data: { fixo: '' } },
      el('div', { class: 'conteudo tc-footer-interno' }, contagem, btnPronto)
    )
  );

  return container;
}
