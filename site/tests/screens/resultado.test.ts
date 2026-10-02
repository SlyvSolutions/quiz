// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../src/app/router', () => ({ navigate: vi.fn() }));
import { salvarSessao } from '../../src/state/sessao-storage';
import { renderResultado } from '../../src/screens/resultado/index';

const trechosOriginais = [
  { id: 'lula-seguranca', candidato_id: 'lula', eixo: 'Segurança', texto_literal: 'Original da Lula' },
  { id: 'flavio-seguranca', candidato_id: 'flavio', eixo: 'Segurança', texto_literal: 'Original do Flavio' },
];
const avaliacoesOriginais = ['lula-seguranca', 'flavio-seguranca'].flatMap((t) =>
  ['C1', 'C2', 'C3', 'C4', 'C5'].map((c) => ({ trecho_id: t, criterio_id: c, veredito: 'Viável', justificativa: 'j', fonte: 'f' }))
);
const subtemas = [
  { id: 's1', eixo: 'Saúde', nome: 'Filas', enunciado: 'Pergunta 1?' },
  { id: 's2', eixo: 'Saúde', nome: 'Prontuário', enunciado: 'Pergunta 2?' },
];
const trechosQuiz = [
  { id: 'lula-s1', candidato_id: 'lula', subtema_id: 's1', eixo: 'Saúde', texto_literal: 'Texto do quiz lula s1' },
  { id: 'flavio-s1', candidato_id: 'flavio', subtema_id: 's1', eixo: 'Saúde', texto_literal: 'Texto do quiz flavio s1' },
  { id: 'lula-s2', candidato_id: 'lula', subtema_id: 's2', eixo: 'Saúde', texto_literal: 'Texto do quiz lula s2' },
];
const avaliacoesQuiz = trechosQuiz.flatMap((t) =>
  ['C1', 'C2', 'C3', 'C4', 'C5'].map((c) => ({ trecho_id: t.id, criterio_id: c, veredito: 'Parcial', justificativa: 'jq', fonte: 'f' }))
);
const candidatos = [
  { id: 'lula', nome: 'Lula', partido: 'PT' },
  { id: 'flavio', nome: 'Flávio Bolsonaro', partido: 'PL' },
  { id: 'renan', nome: 'Renan Santos', partido: 'Missão' },
  { id: 'caiado', nome: 'Ronaldo Caiado', partido: 'PSD' },
  { id: 'cury', nome: 'Augusto Cury', partido: 'Sem Partido' },
];
const criterios = { criterios: ['C1', 'C2', 'C3', 'C4', 'C5'].map((id) => ({ id, nome: `Nome ${id}` })) };

function mockFetch(sem: string[] = []) {
  const mapa: Record<string, unknown> = {
    'trechos.json': trechosOriginais,
    'avaliacoes.json': avaliacoesOriginais,
    'trechos_quiz.json': trechosQuiz,
    'avaliacoes_quiz.json': avaliacoesQuiz,
    'subtemas.json': subtemas,
    'criterios.json': criterios,
    'candidatos.json': candidatos,
  };
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      const chave = Object.keys(mapa).find((k) => url.endsWith('/' + k));
      if (!chave || sem.includes(chave)) return { ok: false, json: async () => ({}) };
      return { ok: true, json: async () => mapa[chave] };
    })
  );
}

const botaoVotoAVoto = (tela: HTMLElement) =>
  [...tela.querySelectorAll('button')].find((b) => b.textContent === 'Ver voto a voto');

const perguntas = [
  { id: 's1', eixo: 'Saúde', subtema_id: 's1', enunciado: 'Pergunta 1?', opcoes: ['lula-s1', 'flavio-s1'] },
  { id: 's2', eixo: 'Saúde', subtema_id: 's2', enunciado: 'Pergunta 2?', opcoes: ['lula-s2'] },
];

beforeEach(() => {
  localStorage.clear();
  document.body.replaceChildren();
});

describe('Resultado: concretude dos planos e modal do candidato', () => {
  const sessao = () =>
    salvarSessao({
      ordemCandidatos: ['lula', 'flavio'],
      respostasQuiz: { s1: 'flavio-s1', s2: 'lula-s2' },
      finalizado: false,
      perguntasQuiz: perguntas,
    });

  it('cada candidato com propostas avaliadas mostra a concretude em %', async () => {
    mockFetch();
    sessao();
    const tela = await renderResultado();
    const cards = [...tela.querySelectorAll('.res-card')];
    const lula = cards.find((c) => c.querySelector('h3')!.textContent === 'Lula')!;
    // lula: 1 trecho original (5 de 5 = 100%) + 2 do quiz (5 critérios Parcial = 100%): todos avaliados
    expect(lula.querySelector('.res-concretude')!.textContent).toContain('Concretude dos planos: 100%');
    const renan = cards.find((c) => c.querySelector('h3')!.textContent === 'Renan Santos')!;
    expect(renan.querySelector('.res-concretude')).toBeNull();
  });

  it('tocar no candidato abre o modal com a porcentagem e as propostas com o selo N de 5', async () => {
    mockFetch();
    sessao();
    const tela = await renderResultado();
    document.body.appendChild(tela);
    const lula = [...tela.querySelectorAll('.res-card')].find((c) => c.querySelector('h3')!.textContent === 'Lula') as HTMLElement;
    const botao = [...lula.querySelectorAll('button')].find((b) => b.textContent?.includes('Ver propostas'));
    expect(botao).toBeTruthy();
    botao!.click();
    const modal = document.querySelector('dialog.ui-modal')!;
    expect(modal.textContent).toContain('Concretude dos planos: 100% (3 propostas avaliadas)');
    expect(modal.querySelectorAll('.modal-cand-proposta').length).toBe(3);
    expect(modal.querySelector('.selo-concretude')!.textContent).toMatch(/CONCRETUDE 5 de 5/);
    expect(modal.textContent).toContain('Texto do quiz lula s1');
  });

  it('sem avaliacoes.json e avaliacoes_quiz.json não há concretude nem botão', async () => {
    mockFetch(['avaliacoes.json', 'avaliacoes_quiz.json']);
    sessao();
    const tela = await renderResultado();
    expect(tela.querySelector('.res-concretude')).toBeNull();
    expect(tela.querySelector('.res-card-clicavel')).toBeNull();
    expect(tela.querySelector('.res-ver-propostas')).toBeNull();
  });
});

describe('Resultado como grande revelação', () => {
  it('o texto de abertura diz concordância com o total de perguntas da sessão e que não é recomendação de voto', async () => {
    mockFetch();
    salvarSessao({ ordemCandidatos: ['lula'], respostasQuiz: { s1: 'lula-s1' }, finalizado: false, perguntasQuiz: perguntas });
    const tela = await renderResultado();
    const lead = tela.querySelector('.res-header .lead')!.textContent!;
    expect(lead).toContain(`Concordância entre o que você escolheu e ${perguntas.length} trechos dos planos`);
    expect(lead).toContain('Não é recomendação de voto');
  });

  it('o ranking mostra só nome e porcentagem: sem selos de força nem de com base', async () => {
    mockFetch();
    salvarSessao({
      ordemCandidatos: ['lula', 'flavio'],
      respostasQuiz: { s1: 'flavio-s1', s2: 'lula-s2' },
      finalizado: false,
      perguntasQuiz: perguntas,
    });
    const tela = await renderResultado();
    expect(tela.querySelectorAll('.res-card').length).toBe(5);
    expect(tela.querySelectorAll('.selo-concretude').length).toBe(0);
    expect(tela.querySelector('.res-concretude-nota')).toBeNull();
    const card = tela.querySelector('.res-card')!;
    expect(card.querySelector('h3')!.textContent).toBeTruthy();
    expect(card.querySelector('.res-afinidade')).not.toBeNull();
    expect(card.textContent).not.toMatch(/for[çc]a|com base/i);
  });

  it('nenhum card do ranking traz link; o único botão é o mesmo "Ver propostas e concretude" para todos', async () => {
    mockFetch();
    salvarSessao({ ordemCandidatos: ['renan'], respostasQuiz: { s1: 'lula-s1' }, finalizado: false, perguntasQuiz: perguntas });
    const tela = await renderResultado();
    const cards = [...tela.querySelectorAll('.res-card')];
    expect(cards.some((c) => c.textContent!.includes('Renan'))).toBe(true);
    for (const c of cards) {
      expect(c.querySelector('a')).toBeNull();
      for (const b of c.querySelectorAll('button')) expect(b.textContent).toContain('Ver propostas');
    }
    expect(tela.textContent).not.toContain('CANDIDATOS DA BASE');
  });

  it('o voto a voto sai da página e vira um botão que abre o painel com TODOS os votos', async () => {
    mockFetch();
    salvarSessao({
      ordemCandidatos: ['lula', 'flavio'],
      respostasQuiz: { s1: 'flavio-s1', s2: 'lula-s2' },
      finalizado: false,
      perguntasQuiz: perguntas,
    });
    const tela = await renderResultado();
    document.body.appendChild(tela);
    expect(tela.querySelector('.res-revelacao')).toBeNull();
    expect(document.querySelector('.ui-slide-panel')).toBeNull();
    const botao = botaoVotoAVoto(tela)!;
    expect(botao).toBeDefined();
    botao.click();
    const painel = document.querySelector('.ui-slide-panel')!;
    expect(painel.getAttribute('role')).toBe('dialog');
    const artigos = painel.querySelectorAll('.res-revelacao-voto');
    expect(artigos).toHaveLength(2);
    expect(artigos[0]!.textContent).toContain('Flávio Bolsonaro');
    expect(artigos[0]!.textContent).toContain('Texto do quiz flavio s1');
    expect(artigos[1]!.textContent).toContain('Lula');
    // Os selos de força continuam existindo dentro do painel
    expect(painel.querySelectorAll('.selo-concretude').length).toBeGreaterThan(0);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await new Promise((r) => setTimeout(r, 500));
    expect(document.querySelector('.ui-slide-panel')).toBeNull();
  });

  it('o painel fecha pelo botão Fechar e devolve o foco ao botão que o abriu', async () => {
    mockFetch();
    salvarSessao({ ordemCandidatos: ['lula'], respostasQuiz: { s1: 'lula-s1' }, finalizado: false, perguntasQuiz: perguntas });
    const tela = await renderResultado();
    document.body.appendChild(tela);
    const botao = botaoVotoAVoto(tela)!;
    botao.focus();
    botao.click();
    (document.querySelector('.ui-slide-close') as HTMLButtonElement).click();
    await new Promise((r) => setTimeout(r, 500));
    expect(document.querySelector('.ui-slide-panel')).toBeNull();
    expect(document.activeElement).toBe(botao);
  });

  it.each([15, 25])('com %i perguntas o painel lista os %i votos e o resumo cita o total', async (n) => {
    const muitas = Array.from({ length: n }, (_, i) => ({
      id: `m${n}-${i}`,
      eixo: 'Saúde',
      subtema_id: `m${n}-${i}`,
      enunciado: `Pergunta m${i}?`,
      opcoes: [`lula-m${n}-${i}`],
    }));
    trechosQuiz.push(...muitas.map((m) => ({ id: `lula-${m.id}`, candidato_id: 'lula', subtema_id: m.id, eixo: 'Saúde', texto_literal: `Texto ${m.id}` })));
    avaliacoesQuiz.push(
      ...muitas.flatMap((m) =>
        ['C1', 'C2', 'C3', 'C4', 'C5'].map((c) => ({ trecho_id: `lula-${m.id}`, criterio_id: c, veredito: 'Parcial', justificativa: 'jq', fonte: 'f' }))
      )
    );
    mockFetch();
    salvarSessao({
      ordemCandidatos: ['lula'],
      respostasQuiz: Object.fromEntries(muitas.map((m) => [m.id, `lula-${m.id}`])),
      finalizado: false,
      perguntasQuiz: muitas,
    });
    const tela = await renderResultado();
    document.body.appendChild(tela);
    botaoVotoAVoto(tela)!.click();
    const painel = document.querySelector('.ui-slide-panel')!;
    expect(painel.querySelectorAll('.res-revelacao-voto')).toHaveLength(n);
    expect(tela.querySelector('.res-header .lead')!.textContent).toContain(`${n} trechos dos planos`);
    for (const v of painel.querySelectorAll('.res-revelacao-voto')) {
      expect(v.querySelectorAll('.slide-criterios-item')).toHaveLength(5);
    }
  });

  it('pergunta pulada não aparece na revelação e não conta como válida', async () => {
    mockFetch();
    salvarSessao({
      ordemCandidatos: ['lula'],
      respostasQuiz: { s1: 'pular', s2: 'lula-s2' },
      finalizado: false,
      perguntasQuiz: perguntas,
    });
    const tela = await renderResultado();
    expect(tela.textContent).toContain('poucas perguntas (1 de 2)');
  });

  it('tudo pulado mostra o aviso e não a revelação', async () => {
    mockFetch();
    salvarSessao({
      ordemCandidatos: ['lula'],
      respostasQuiz: { s1: 'pular', s2: 'pular' },
      finalizado: false,
      perguntasQuiz: perguntas,
    });
    const tela = await renderResultado();
    expect(tela.textContent).toContain('Você pulou todas as perguntas');
    expect(botaoVotoAVoto(tela)).toBeUndefined();
  });

  it('sessão sem perguntasQuiz (versão antiga) funciona como antes, sem revelação', async () => {
    mockFetch();
    salvarSessao({ ordemCandidatos: ['lula'], respostasQuiz: { a: 'lula-seguranca' }, finalizado: false });
    const tela = await renderResultado();
    expect(botaoVotoAVoto(tela)).toBeUndefined();
    expect(tela.querySelectorAll('.res-card').length).toBeGreaterThan(0);
  });

  it('se os dados do quiz não carregarem, o ranking aparece e a revelação some sem quebrar', async () => {
    mockFetch(['trechos_quiz.json', 'avaliacoes_quiz.json', 'subtemas.json']);
    salvarSessao({
      ordemCandidatos: ['lula'],
      respostasQuiz: { s1: 'lula-s1', s2: 'lula-s2' },
      finalizado: false,
      perguntasQuiz: perguntas,
    });
    const tela = await renderResultado();
    expect(botaoVotoAVoto(tela)).toBeUndefined();
    expect(tela.classList.contains('screen-resultado')).toBe(true);
    expect(tela.querySelectorAll('.res-card').length).toBe(5);
  });

  it('sem candidatos.json mostra erro visível, sem ranking e sem nomes de reserva', async () => {
    mockFetch(['candidatos.json']);
    salvarSessao({ ordemCandidatos: ['lula'], respostasQuiz: { s1: 'lula-s1' }, finalizado: false, perguntasQuiz: perguntas });
    const tela = await renderResultado();
    expect(tela.textContent).toContain('Não foi possível carregar os candidatos');
    expect(tela.querySelectorAll('.res-card')).toHaveLength(0);
  });
});
