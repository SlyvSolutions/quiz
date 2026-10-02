// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../src/app/router', () => ({ navigate: vi.fn() }));
import { navigate } from '../../src/app/router';
import { salvarSessao, lerSessao, aplicarOrdemTesteCego } from '../../src/state/sessao-storage';
import { renderQuiz } from '../../src/screens/quiz/index';

const EIXOS = ['Segurança', 'Economia', 'Educação', 'Reformas', 'Saúde'];
const CANDS = ['lula', 'flavio', 'caiado', 'renan'];
const subtemas = EIXOS.flatMap((e) =>
  [1, 2, 3].map((i) => ({ id: `${e}-${i}`, eixo: e, nome: `${e} ${i}`, enunciado: `Enunciado ${e} ${i}?` }))
);
const trechosQuiz = subtemas.flatMap((s) =>
  CANDS.map((c) => ({ id: `${c}-${s.id}`, candidato_id: c, subtema_id: s.id, eixo: s.eixo }))
);
const planos = trechosQuiz.map((t, i) => ({
  id: t.id,
  apelido_neutro: `Candidato ${'ABCD'[i % 4]}`,
  eixo: t.eixo,
  subtema_id: t.subtema_id,
  texto_mascarado: `Texto mascarado de ${t.id}`,
}));
const avaliacoes = trechosQuiz.flatMap((t) =>
  ['C1', 'C2', 'C3', 'C4', 'C5'].map((c) => ({
    trecho_id: t.id,
    criterio_id: c,
    veredito: 'Parcial',
    justificativa: c === 'C1' ? 'O trecho cita o Programa Mais Médicos e o Novo PAC, no nosso governo.' : `j ${c}`,
    fonte: 'Lula_Plano_Original.md:10-12',
  }))
);
const criterios = { criterios: ['C1', 'C2', 'C3', 'C4', 'C5'].map((id) => ({ id, nome: `Nome ${id}` })) };

function mockFetch(falha = false) {
  const mapa: Record<string, unknown> = {
    'subtemas.json': subtemas,
    'trechos_quiz.json': trechosQuiz,
    'planos_cegos_quiz.json': planos,
    'avaliacoes_quiz.json': avaliacoes,
    'criterios.json': criterios,
  };
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      const chave = Object.keys(mapa).find((k) => url.endsWith(k));
      if (falha || !chave) return { ok: false, json: async () => ({}) };
      return { ok: true, json: async () => mapa[chave] };
    })
  );
}

const esperar = (ms = 250) => new Promise((r) => setTimeout(r, ms));
const botao = (raiz: ParentNode, texto: string) =>
  [...raiz.querySelectorAll('button')].find((b) => b.textContent?.includes(texto));

beforeEach(() => {
  localStorage.clear();
  document.body.replaceChildren();
  vi.mocked(navigate).mockClear();
  salvarSessao({ ordemCandidatos: ['lula', 'flavio'], respostasQuiz: {}, finalizado: false, revelacaoVista: true });
});

describe('quiz por subtemas', () => {
  it('sorteia 15 perguntas, guarda na sessão e mostra o passo 1 de 15 sem identificar autor', async () => {
    mockFetch();
    const tela = await renderQuiz();
    document.body.append(tela);
    expect(tela.textContent).toContain('Passo 1 de 15');
    expect(tela.querySelectorAll('.quiz-option-card').length).toBeGreaterThanOrEqual(3);
    expect(tela.textContent).not.toMatch(/Candidato [A-E]|Ler plano completo|Lula|Flávio|Caiado|Renan/);
    expect(lerSessao()!.perguntasQuiz).toHaveLength(15);
  });

  it('o título da pergunta é o enunciado do subtema', async () => {
    mockFetch();
    const tela = await renderQuiz();
    const p = lerSessao()!.perguntasQuiz![0]!;
    expect(tela.querySelector('.quiz-question')!.textContent).toBe(p.enunciado);
  });

  it('depois de escolher mostra o slide dos critérios e o botão Próxima pergunta', async () => {
    mockFetch();
    const tela = await renderQuiz();
    document.body.append(tela);
    (tela.querySelector('.quiz-option-content') as HTMLElement).click();
    await esperar();
    expect(tela.querySelector('.slide-criterios')).not.toBeNull();
    expect(tela.querySelectorAll('.slide-criterios-item')).toHaveLength(5);
    const proxima = botao(tela, 'Próxima pergunta');
    expect(proxima).toBeTruthy();
    proxima!.click();
    await esperar();
    expect(tela.textContent).toContain('Passo 2 de 15');
    expect(tela.querySelector('.slide-criterios')).toBeNull();
  });

  it('o slide por voto não revela autor', async () => {
    mockFetch();
    const tela = await renderQuiz();
    document.body.append(tela);
    (tela.querySelector('.quiz-option-content') as HTMLElement).click();
    await esperar();
    const slide = tela.querySelector('.slide-criterios')!.textContent ?? '';
    expect(slide).not.toMatch(/Lula|Flávio|Caiado|Renan|Cury|Missão|Candidato [A-E]/);
  });

  it('o verso mascara nomes de programas e autorreferência na justificativa e nunca mostra a fonte', async () => {
    mockFetch();
    const tela = await renderQuiz();
    document.body.append(tela);
    (tela.querySelector('.quiz-option-content') as HTMLElement).click();
    await esperar();
    const verso = tela.querySelector('.quiz-verso')!.textContent ?? '';
    expect(verso).toContain('[programa federal de atenção médica]');
    expect(verso).toContain('[programa federal de investimentos em infraestrutura]');
    expect(verso).toContain('no [***].');
    expect(verso).not.toMatch(/Mais Médicos|Novo PAC|nosso governo|Plano_Original|\.md/);
  });

  it('recarregar no meio mantém as mesmas perguntas', async () => {
    mockFetch();
    const primeira = await renderQuiz();
    document.body.append(primeira);
    const antes = lerSessao()!.perguntasQuiz!.map((p) => p.id);
    const segunda = await renderQuiz();
    expect(lerSessao()!.perguntasQuiz!.map((p) => p.id)).toEqual(antes);
    expect(segunda.textContent).toContain('Passo 1 de 15');
  });

  it('pular avança sem mostrar slide e grava "pular"', async () => {
    mockFetch();
    const tela = await renderQuiz();
    document.body.append(tela);
    botao(tela, 'Pular')!.click();
    await esperar();
    expect(tela.querySelector('.slide-criterios')).toBeNull();
    expect(tela.textContent).toContain('Passo 2 de 15');
    expect(Object.values(lerSessao()!.respostasQuiz)).toContain('pular');
  });

  it('na última pergunta o botão leva ao resultado', async () => {
    mockFetch();
    const tela = await renderQuiz();
    document.body.append(tela);
    for (let i = 0; i < 15; i++) {
      (tela.querySelector('.quiz-option-content') as HTMLElement).click();
      await esperar(60);
      const b = botao(tela, i === 14 ? 'Ver resultado' : 'Próxima pergunta');
      expect(b).toBeTruthy();
      b!.click();
      await esperar(60);
    }
    expect(navigate).toHaveBeenCalledWith('#resultado');
  });

  it('falha de carga mostra mensagem e botão para o início', async () => {
    mockFetch(true);
    const tela = await renderQuiz();
    expect(tela.textContent).toContain('Não foi possível carregar o quiz');
    expect(botao(tela, 'Voltar ao Início')).toBeTruthy();
  });

  it('sessão antiga sem perguntasQuiz faz um sorteio novo e descarta as respostas antigas', async () => {
    mockFetch();
    salvarSessao({ ordemCandidatos: ['lula'], respostasQuiz: { antigo: 'x' }, finalizado: false, revelacaoVista: true });
    const tela = await renderQuiz();
    expect(lerSessao()!.perguntasQuiz!.length).toBeGreaterThan(0);
    expect(lerSessao()!.respostasQuiz).toEqual({});
    expect(tela.textContent).toContain('Passo 1 de 15');
  });

  it('sessão guardada de 10 perguntas sorteia de novo (15), mantém ordem e revelação e zera as respostas', async () => {
    mockFetch();
    const dez = EIXOS.flatMap((e) =>
      [1, 2].map((i) => ({
        id: `${e}-${i}`,
        eixo: e,
        subtema_id: `${e}-${i}`,
        enunciado: `Enunciado ${e} ${i}?`,
        opcoes: ['lula', 'flavio', 'caiado'].map((c) => `${c}-${e}-${i}`),
      }))
    );
    salvarSessao({
      ordemCandidatos: ['caiado', 'lula'],
      respostasQuiz: { [dez[0]!.id]: dez[0]!.opcoes[0]! },
      finalizado: false,
      revelacaoVista: true,
      perguntasQuiz: dez,
    });
    const tela = await renderQuiz();
    const s = lerSessao()!;
    expect(s.perguntasQuiz).toHaveLength(15);
    expect(s.ordemCandidatos).toEqual(['caiado', 'lula']);
    expect(s.revelacaoVista).toBe(true);
    expect(s.respostasQuiz).toEqual({});
    expect(tela.textContent).toContain('Passo 1 de 15');
  });

  it('subtema que não existe mais na sessão guardada sorteia de novo', async () => {
    mockFetch();
    const base = await renderQuiz();
    expect(base).toBeTruthy();
    const guardadas = lerSessao()!.perguntasQuiz!.map((p, i) => (i === 0 ? { ...p, id: 'sumiu', subtema_id: 'sumiu' } : p));
    salvarSessao({ ...lerSessao()!, perguntasQuiz: guardadas });
    await renderQuiz();
    expect(lerSessao()!.perguntasQuiz!.some((p) => p.subtema_id === 'sumiu')).toBe(false);
  });

  it('quiz válido em andamento (recarregar) mantém as perguntas e as respostas', async () => {
    mockFetch();
    await renderQuiz();
    const antes = lerSessao()!.perguntasQuiz!;
    const resp = { [antes[0]!.id]: antes[0]!.opcoes[0]! };
    salvarSessao({ ...lerSessao()!, respostasQuiz: resp });
    const tela = await renderQuiz();
    expect(lerSessao()!.perguntasQuiz).toEqual(antes);
    expect(lerSessao()!.respostasQuiz).toEqual(resp);
    expect(tela.textContent).toContain('Passo 2 de 15');
  });

  it('o card escolhido vira: o verso tem os 5 critérios e fica dentro do card, não abaixo das opções', async () => {
    mockFetch();
    const tela = await renderQuiz();
    document.body.append(tela);
    const opcoes = [...tela.querySelectorAll<HTMLElement>('.quiz-option-content')];
    opcoes[1]!.click();
    await esperar();
    const cards = tela.querySelectorAll('.quiz-option-card');
    const escolhido = tela.querySelector('.quiz-option-card.selecionada')!;
    expect(escolhido).toBe(cards[1]);
    const verso = escolhido.querySelector<HTMLElement>('.quiz-verso')!;
    expect(verso).not.toBeNull();
    expect(verso.querySelectorAll('.slide-criterios-item')).toHaveLength(5);
    expect(verso.querySelector('.selo-concretude')).not.toBeNull();
    // um único verso, e não sobra slide fora do card
    expect(tela.querySelectorAll('.quiz-verso')).toHaveLength(1);
    expect(tela.querySelectorAll('.slide-criterios')).toHaveLength(1);
    expect(tela.querySelector('.quiz-options')!.contains(tela.querySelector('.slide-criterios'))).toBe(true);
    // as outras opções seguem na tela, sem verso
    expect(cards).toHaveLength(opcoes.length);
    expect(cards[0]!.querySelector('.quiz-verso')).toBeNull();
  });

  it('o verso é escuro (tema escuro, tokens), anuncia o que é, recebe o foco e a frente sai da navegação', async () => {
    mockFetch();
    const tela = await renderQuiz();
    document.body.append(tela);
    (tela.querySelector('.quiz-option-content') as HTMLElement).click();
    await esperar();
    const verso = tela.querySelector<HTMLElement>('.quiz-verso')!;
    expect(verso.dataset.tema).toBe('escuro');
    expect(verso.getAttribute('aria-label')).toMatch(/critérios/i);
    expect(document.activeElement).toBe(verso);
    expect(tela.querySelector('.quiz-frente')!.hasAttribute('inert')).toBe(true);
    expect(tela.querySelector('.quiz-flip')!.classList.contains('virado')).toBe(true);
  });

  it('o verso não revela autor, partido nem apelido', async () => {
    mockFetch();
    const tela = await renderQuiz();
    document.body.append(tela);
    (tela.querySelector('.quiz-option-content') as HTMLElement).click();
    await esperar();
    const t = tela.querySelector('.quiz-verso')!.textContent ?? '';
    expect(t).not.toMatch(/Lula|Flávio|Caiado|Renan|Cury|Missão|Candidato [A-E]|PSD|PL\b|Novo/);
  });

  it('antes do voto não há verso e a próxima pergunta volta sem verso', async () => {
    mockFetch();
    const tela = await renderQuiz();
    document.body.append(tela);
    expect(tela.querySelector('.quiz-verso')).toBeNull();
    (tela.querySelector('.quiz-option-content') as HTMLElement).click();
    await esperar();
    botao(tela, 'Próxima pergunta')!.click();
    await esperar();
    expect(tela.querySelector('.quiz-verso')).toBeNull();
    expect(tela.querySelector('.quiz-flip.virado')).toBeNull();
  });

  it('quiz concluído e teste cego refeito: sorteio novo com os mesmos 15 subtemas e a ordem sorteada de novo', async () => {
    mockFetch();
    await renderQuiz();
    const primeiro = lerSessao()!;
    expect(primeiro.perguntasQuiz).toHaveLength(15);
    // chegou ao Resultado
    salvarSessao({
      ...primeiro,
      respostasQuiz: Object.fromEntries(primeiro.perguntasQuiz!.map((p) => [p.id, 'pular'])),
      finalizado: true,
    });
    // refaz o teste cego (mesma ordem)
    salvarSessao(aplicarOrdemTesteCego(lerSessao(), primeiro.ordemCandidatos));
    const tela = await renderQuiz();
    expect(tela.textContent).toContain('Passo 1 de 15');
    const segundo = lerSessao()!;
    expect(segundo.respostasQuiz).toEqual({});
    expect(segundo.perguntasQuiz).toHaveLength(15);
    expect(new Set(segundo.perguntasQuiz!.map((p) => p.subtema_id))).toEqual(new Set(primeiro.perguntasQuiz!.map((p) => p.subtema_id)));
  });

  it('o quiz só grava a chave da sessão: nenhum registro de subtemas vistos', async () => {
    mockFetch();
    await renderQuiz();
    expect(Object.keys(localStorage)).toEqual(['mq.sessao.v1']);
  });

  it('recarregar no meio, depois de refazer o teste cego, mantém o novo quiz', async () => {
    mockFetch();
    await renderQuiz();
    salvarSessao(aplicarOrdemTesteCego({ ...lerSessao()!, finalizado: true }, ['lula', 'flavio']));
    await renderQuiz();
    const antes = lerSessao()!.perguntasQuiz!.map((p) => p.id);
    await renderQuiz();
    expect(lerSessao()!.perguntasQuiz!.map((p) => p.id)).toEqual(antes);
  });

  it('sem sessão mostra aviso e botão para o início', async () => {
    localStorage.clear();
    mockFetch();
    const tela = await renderQuiz();
    expect(tela.textContent).toContain('Sessão não encontrada');
  });
});
