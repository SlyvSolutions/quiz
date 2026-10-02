// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';

vi.mock('../../src/app/router', () => ({ navigate: vi.fn() }));
import { renderComparador } from '../../src/screens/comparador/index';
import { renderResultado } from '../../src/screens/resultado/index';
import { salvarSessao } from '../../src/state/sessao-storage';
import { sortearPerguntas, type SubtemaQuiz, type TrechoQuizRef } from '../../src/core/sorteio-quiz';

const lerDado = (arq: string) => JSON.parse(readFileSync(`public/data/${arq}`, 'utf8'));

beforeEach(() => {
  localStorage.clear();
  document.body.replaceChildren();
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      const arq = url.split('/data/')[1] ?? '';
      try {
        return { ok: true, json: async () => lerDado(arq) };
      } catch {
        return { ok: false, json: async () => ({}) };
      }
    })
  );
});

describe('Comparador com os dados reais: todos os trechos', () => {
  it('mostra os 25 trechos (5 candidatos x 5 eixos), cada um com os 5 critérios, nenhum ausente', async () => {
    const tela = await renderComparador();
    const cards = [...tela.querySelectorAll('.comp-trecho-card')];
    expect(cards).toHaveLength(25);
    const trechos = lerDado('trechos.json') as { id: string; candidato_id: string; eixo: string; texto_literal: string }[];
    expect(trechos).toHaveLength(25);

    const porCandidatoEixo = new Set(trechos.map((t) => `${t.candidato_id}|${t.eixo}`));
    expect(porCandidatoEixo.size).toBe(25);
    expect(new Set(trechos.map((t) => t.candidato_id)).size).toBe(5);
    expect(new Set(trechos.map((t) => t.eixo)).size).toBe(5);

    const textos = cards.map((c) => c.querySelector('.comp-literal')!.textContent);
    for (const t of trechos) expect(textos).toContain(`"${t.texto_literal}"`);

    for (const c of cards) {
      expect(c.querySelectorAll('.comp-av-item')).toHaveLength(5);
      const crits = [...c.querySelectorAll('.comp-av-crit')].map((x) => x.textContent);
      expect(crits).toEqual(['C1:', 'C2:', 'C3:', 'C4:', 'C5:']);
    }
  });
});

describe('Resultado com os dados reais: o painel lista todos os votos da sessão', () => {
  it('15 perguntas respondidas: 15 votos no painel, cada um com os 5 critérios', async () => {
    const subtemas = lerDado('subtemas.json') as SubtemaQuiz[];
    const trechosQuiz = lerDado('trechos_quiz.json') as TrechoQuizRef[];
    const perguntas = sortearPerguntas(subtemas, trechosQuiz, { rng: () => 0.37 });
    expect(perguntas).toHaveLength(15);
    salvarSessao({
      ordemCandidatos: ['lula', 'flavio', 'caiado', 'renan', 'cury'],
      respostasQuiz: Object.fromEntries(perguntas.map((p) => [p.id, p.opcoes[0]!])),
      finalizado: false,
      perguntasQuiz: perguntas,
    });
    const tela = await renderResultado();
    document.body.appendChild(tela);
    [...tela.querySelectorAll('button')].find((b) => b.textContent === 'Ver voto a voto')!.click();
    const votos = [...document.querySelectorAll('.ui-slide-panel .res-revelacao-voto')];
    expect(votos).toHaveLength(15);
    for (const v of votos) expect(v.querySelectorAll('.slide-criterios-item')).toHaveLength(5);
  });
});
