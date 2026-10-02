import { el, anexar } from '../../ui/dom';
import { criarBotaoPill } from '../../ui/botao';
import { criarIcone } from '../../ui/icone';
import { criarOnca } from '../../ui/logo';
import { criarBotaoRolar } from '../../ui/rolar';
import { AVISO_AUTORIA } from '../../ui/aviso';
import type { SessaoJornada } from '../../core/jornada';

export interface ContextoSlides {
  sessao: SessaoJornada | null;
  aoAvancar(): void;
  aoPular(): void;
  aoComecar(destino: string): void;
}

function slideBase(n: number, nome: string, tema: 'escuro' | 'claro', ...filhos: (Node | string | null | undefined | false)[]): HTMLElement {
  const s = el('section', {
    class: `wizard-slide wizard-tema-${tema}`,
    attrs: { 'data-slide': String(n), 'data-tema': tema, 'aria-label': `Slide ${n} de 5: ${nome}` },
  });
  anexar(s, filhos);
  return s;
}

function microRodape(): HTMLElement {
  return el('p', { class: 'wizard-assinatura', texto: AVISO_AUTORIA });
}

/** Avanço intuitivo no conteúdo: mesmo gesto do slide 1, sem depender da seta de baixo. */
function botaoProximo(aoAvancar: () => void): HTMLElement {
  const btn = criarBotaoPill('PRÓXIMO', 'primaria', { seta: true });
  btn.addEventListener('click', aoAvancar);
  return btn;
}

function slideProvocacao(ctx: ContextoSlides): HTMLElement {
  const btn = criarBotaoPill('VER COMO FUNCIONA', 'primaria', { seta: true });
  btn.addEventListener('click', ctx.aoAvancar);
  return slideBase(1, 'provocação', 'escuro',
    el('p', { class: 'eyebrow', texto: 'TESTE CEGO · PLANOS OFICIAIS DO TSE' }),
    el('h1', { texto: 'A PROPOSTA ANTES DA NARRATIVA.' }),
    el('p', { texto: 'Todo candidato tem uma história que puxa seu voto. Aqui você lê primeiro as propostas — trechos literais dos planos oficiais depositados no TSE — e decide pelo que você realmente acredita. O nome só aparece depois.' }),
    btn,
    microRodape(),
  );
}

function slideCTA(ctx: ContextoSlides): HTMLElement {
  const btn = criarBotaoPill('COMEÇAR TESTE CEGO', 'primaria', { seta: true, grande: true });
  btn.addEventListener('click', () => ctx.aoComecar('#teste-cego'));
  return slideBase(5, 'começar', 'escuro',
    el('h2', { texto: 'PRONTO PRA VOTAR NAS IDEIAS?' }),
    btn,
    el('p', { class: 'wizard-glorioso', texto: 'O FUTURO É GLORIOSO' }),
    microRodape(),
  );
}

function expansivel(
  id: string,
  numero: string,
  nome: string,
  corpo: string,
  aoAbrir: (id: string) => void,
  extra?: { tag: string; meta: string; codigo: string },
): HTMLElement {
  const summary = el('summary', {},
    el('span', { class: 'wizard-num', texto: numero, attrs: { 'aria-hidden': 'true' } }),
    el('span', { class: 'wizard-nome', texto: nome }),
    extra ? el('span', { class: 'wizard-s2-tag', texto: extra.tag }) : null,
    criarIcone('seta'),
  );
  const d = el('details', { class: 'wizard-expansivel wizard-s2-passo', attrs: { id } },
    summary,
    el('div', { class: 'contexto-corpo' },
      extra ? el('p', { class: 'eyebrow', texto: `${numero} · ${nome}` }) : null,
      extra ? el('p', { class: 'wizard-detalhe-veredito', texto: extra.tag }) : null,
      el('p', { texto: corpo }),
       extra ? el('p', { class: 'wizard-nota', texto: extra.meta }) : null,
    ),
  );
  d.addEventListener('toggle', () => {
    if ((d as HTMLDetailsElement).open) aoAbrir(id);
  });
  return d;
}

/** Conteúdo do modal do slide 2 ("O SORTEIO"). Cria elementos novos a cada abertura. */
export function criarConteudoSorteio(): HTMLElement {
  return el('div', { class: 'pilha' },
    el('h3', { texto: 'A ORDEM É SORTEADA?' }),
    el('ol', { class: 'wizard-metodo-passos' },
      el('li', {}, el('strong', { texto: 'Sorteio uniforme. ' }), 'Planos do teste cego e opções do quiz saem em ordem sorteada. Nenhum plano entra com vantagem — nem o nosso.'),
      el('li', {}, el('strong', { texto: 'Sorteio por sessão. ' }), 'A ordem é sorteada a cada sessão e guardada no seu navegador — recarregar mantém a mesma ordem; refazer a jornada sorteia de novo.'),
      el('li', {}, el('strong', { texto: 'Cego até revelar. ' }), 'Nomes e identificadores do autor como [***], e nomes de programas por rótulo neutro, até você fechar sua ordem. Nada a ver com o sorteio do exemplo do slide 3 (1 em 5 no demo).'),
    ),
    el('div', { class: 'wizard-sorteio-justo' },
      el('p', { texto: 'Fisher-Yates (embaralhamento uniforme), sorteado por sessão no teste e no quiz:' }),
      el('pre', { class: 'wizard-codigo' },
        el('code', { texto: 'embaralhar(lista, rng) // src/core/sorteio-quiz.ts' }),
      ),
      el('p', { class: 'wizard-nota', texto: 'Sem login, sem rastreio.' }),
    ),
  );
}

function slideComoFunciona(aoAvancar: () => void): HTMLElement {
  const nada = () => {};
  const btnMetodo = criarBotaoPill('COMO FUNCIONA O MÉTODO', 'secundaria', { seta: true });
  btnMetodo.id = 'btn-jornada-metodo';
  btnMetodo.setAttribute('aria-haspopup', 'dialog');
  btnMetodo.addEventListener('click', async () => {
    const { abrirSlidePanel } = await import('../../ui/slide-panel');
    if (document.querySelector('.ui-slide-panel')) return;
    abrirSlidePanel('O SORTEIO', criarConteudoSorteio());
  });
  const passos: Array<[string, string, string, string, { tag: string; meta: string; codigo: string }]> = [
    ['s2-p1', '1', 'TESTE CEGO',
      'Cinco planos com apelidos neutros (Plano 1 a Plano 5), ordem embaralhada a cada sessão. Trechos palavra por palavra — transcrição exata, só com nomes de candidatos, partidos e outros identificadores do autor trocados por [***] e nomes de programas por um rótulo neutro. Você ordena do que mais gostou ao que menos gostou: toque em Escolher no que mais gostou (ele vira o 1º), depois no 2º, e assim por diante. Os nomes só aparecem depois que você fecha sua ordem.',
      { tag: 'CEGO · 5 PLANOS', meta: 'Sorteio por sessão · recarregar a página mantém a ordem', codigo: 'embaralhar(planos, rng)' }],
    ['s2-p2', '2', 'REVELAÇÃO',
      'Os nomes dos 5 candidatos são revelados: você vê quem era cada plano que ordenou.',
      { tag: 'QUEM ERA QUEM', meta: 'Entrada: sua ordem · Saída: 5 nomes revelados', codigo: 'revelar(ordem) → 5 nomes' }],
    ['s2-p3', '3', 'QUIZ',
      '15 perguntas, 3 por eixo (Segurança, Economia, Educação, Reformas, Saúde). Cada pergunta mostra de 3 a 5 trechos mascarados do mesmo assunto. Ao escolher, o trecho vira e mostra as 5 avaliações dele, ainda sem dizer de quem é. Pular não conta na afinidade.',
      { tag: '15 PERGUNTAS · 5 EIXOS', meta: 'Opções sorteadas a cada pergunta · pular não entra na conta', codigo: 'embaralhar(opcoes, rng)' }],
    ['s2-p4', '4', 'RESULTADO + COMPARADOR',
      'Afinidade = trechos dele que você escolheu ÷ perguntas em que você escolheu alguém × 100. Toque num candidato para ver as propostas dele e a concretude. O Comparador abre no fim, com todos os trechos, critérios e fontes.',
      { tag: 'AFINIDADE %', meta: 'Toque num candidato para ver propostas e concretude', codigo: 'afinidade = escolhidos ÷ respondidas × 100' }],
  ];
  const detalhes = passos.map(([id, numero, nome, corpo, extra]) => expansivel(id, numero, nome, corpo, nada, extra));
  const duelo = el('div', { class: 'wizard-duelo', attrs: { id: 'jornada-duelo' } },
    el('div', { class: 'wizard-s2-lista', attrs: { id: 'jornada-lista' } }, ...detalhes),
  );
  const acoes = el('div', { class: 'wizard-acoes' }, botaoProximo(aoAvancar));
  const slide = slideBase(2, 'como funciona', 'claro',
    el('p', { class: 'eyebrow', texto: 'O JOGO' }),
    el('h2', { texto: 'DO TESTE AO RESULTADO EM 4 PASSOS.' }),
    el('p', { class: 'wizard-s2-lead' }, 'Uma jornada cega em 4 passos; no fim, o Comparador abre. A ordem é sorteada por sessão.'),
    btnMetodo,
    duelo,
    acoes,
  );
  const rolagem = criarBotaoRolar(slide, acoes);
  slide.appendChild(rolagem.botao);
  return slide;
}


export function criarConteudoMetodo(): HTMLElement {
  return el('div', { class: 'pilha' },
    el('p', { class: 'eyebrow', texto: 'METODOLOGIA' }),
    el('ol', { class: 'wizard-metodo-passos' },
      el('li', {}, el('strong', { texto: 'Texto literal. ' }), 'Cada frase é copiada do PDF depositado no TSE. Se o script não achar a frase no original, ela não publica.'),
      el('li', {}, el('strong', { texto: 'Máscara. ' }), 'Na hora de escolher, identificadores do autor viram [***] e nomes de programas viram um rótulo neutro. O texto original só aparece no Resultado.'),
      el('li', {}, el('strong', { texto: 'Contexto. ' }), 'O parágrafo em volta vem junto, pela mesma regra mecânica para os 5.'),
      el('li', {}, el('strong', { texto: '5 critérios, 1 escala. ' }), 'Fonte de recurso, mudança legal, Congresso, precedente, prazo. Escala de 6 vereditos; sem fonte, “Sem base para avaliar”.'),
      el('li', {}, el('strong', { texto: 'Concretude. ' }), 'Quantos dos 5 critérios deu para avaliar com fonte (“3 de 5”). Não mede se a ideia é boa nem se vai dar certo: isso fica no veredito de cada critério.'),
      el('li', {}, el('strong', { texto: 'Auditoria aberta. ' }), 'Arquivo + linha + hash SHA-256 + código aberto. Confira você mesmo.'),
    ),
    el('div', { class: 'wizard-sorteio-justo' },
      el('h3', { texto: 'O SORTEIO É JUSTO?' }),
      el('p', { texto: '5 trechos no chapéu, 1 diferencial por candidato: todo trecho tem a mesma chance (1 em 5). Sorteio uniforme, sem peso para ninguém — nem para o nosso.' }),
      el('pre', { class: 'wizard-codigo' },
        el('code', { texto: 'trecho = demo[Math.floor(Math.random() * demo.length)]' }),
      ),
      el('p', { class: 'wizard-nota', texto: 'Nenhum trecho do demo aparece nos jogos: o build falha se um id vazar para o teste cego ou o quiz. O código completo está em exemplo-sorteio.ts, no repositório aberto.' }),
    ),
  );
}

function slideCriterios(aoAvancar: () => void): HTMLElement {
  const btnSortear = criarBotaoPill('SORTEAR OUTRO', 'secundaria');
  btnSortear.id = 'btn-sortear-outro';
  const btnMetodo = criarBotaoPill('COMO FUNCIONA O MÉTODO', 'secundaria', { seta: true });
  btnMetodo.id = 'btn-metodo-abrir';
  btnMetodo.setAttribute('aria-haspopup', 'dialog');
  btnMetodo.addEventListener('click', async () => {
    const { abrirSlidePanel } = await import('../../ui/slide-panel');
    if (document.querySelector('.ui-slide-panel')) return;
    abrirSlidePanel('COMO FUNCIONA O MÉTODO', criarConteudoMetodo());
  });
  const metodoBloco = el('div', { class: 'wizard-metodo-bloco' }, btnMetodo);
  const slide = slideBase(3, 'critérios', 'claro',
    el('p', { class: 'eyebrow', texto: 'O MÉTODO' }),
    el('h2', { texto: 'A RÉGUA, NA PRÁTICA.' }),
    el('p', {},
      'Trecho sorteado ao acaso: ',
      el('strong', { attrs: { id: 'sorteio-nome' }, texto: 'SORTEANDO…' }),
    ),
    el('div', { class: 'wizard-trecho' },
      el('p', { class: 'wizard-trecho-texto', attrs: { id: 'sorteio-trecho' }, texto: '…' }),
      el('p', { class: 'wizard-trecho-ref', attrs: { id: 'sorteio-ref' }, texto: '' }),
    ),
    el('div', { class: 'wizard-criterios', attrs: { id: 'sorteio-criterios' } }),
    el('p', { class: 'wizard-nota', attrs: { id: 'sorteio-offline', hidden: '' }, texto: 'Sem conexão: conecte-se para sortear um trecho de demonstração.' }),
    el('p', { class: 'wizard-nota', texto: 'Demonstração: um trecho sorteado e as 5 avaliações dele, com a mesma régua para os cinco candidatos. Nos jogos, o autor fica escondido até o Resultado.' }),
    el('div', { class: 'wizard-s3-acoes' }, btnSortear, botaoProximo(aoAvancar)),
    metodoBloco,
  );
  const rolagem = criarBotaoRolar(slide, metodoBloco);
  slide.appendChild(rolagem.botao);
  return slide;
}

function slideVirada(aoAvancar: () => void): HTMLElement {
  const metodo = el('a', { class: 'metodo-fonte', attrs: { href: '#metodo' } }, 'VER MÉTODO E FONTES');
  const gh = el('a', { class: 'metodo-fonte', attrs: { href: 'https://github.com/SlyvSolutions/quiz', target: '_blank', rel: 'noopener noreferrer' } }, 'VER NO GITHUB');
  return slideBase(4, 'virada missão', 'escuro',
    el('div', { class: 'inicio-objeto flutuar' }, criarOnca()),
    el('p', { class: 'eyebrow', texto: 'FEITO POR APOIADORES DO MISSÃO' }),
    el('h2', { texto: 'A GENTE CONFIA NAS NOSSAS IDEIAS. POR ISSO ABRIMOS TUDO.' }),
    el('p', { texto: 'Renan Santos (Missão, 14) é um dos 5 candidatos. Como a gente acredita nas propostas dele, aplicamos os mesmos 5 critérios, a mesma escala e a mesma regra de seleção de trechos literais do TSE pros 5 — inclusive o nosso.' }),
    el('p', { texto: 'Não precisa confiar na gente. Confira você mesmo: arquivo + linha · hash SHA-256 · código aberto.' }),
    metodo, gh,
    el('div', { class: 'wizard-acoes' }, botaoProximo(aoAvancar)),
    microRodape(),
  );
}

export function criarSlides(ctx: ContextoSlides): HTMLElement[] {
  return [
    slideProvocacao(ctx),
    slideComoFunciona(ctx.aoAvancar),
    slideCriterios(ctx.aoAvancar),
    slideVirada(ctx.aoAvancar),
    slideCTA(ctx),
  ];
}
