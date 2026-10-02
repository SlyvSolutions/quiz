// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { renderTesteCego } from '../../src/screens/teste-cego/index';
import { lerSessao, salvarSessao, aplicarOrdemTesteCego } from '../../src/state/sessao-storage';

const planos = JSON.parse(readFileSync('public/data/planos_cegos.json', 'utf8'));
const APELIDOS = [...new Set<string>(planos.map((p: { apelido_neutro: string }) => p.apelido_neutro))].sort();

function sequencia(valores: number[]) {
  let i = 0;
  return () => valores[i++ % valores.length]!;
}

async function ordemNaTela(rng?: () => number): Promise<string[]> {
  const tela = await renderTesteCego(rng);
  return Array.from(tela.querySelectorAll<HTMLElement>('.tc-list:not(.ranked-list) .tc-card')).map((c) => c.dataset.id!);
}

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal('fetch', async () => ({ ok: true, json: async () => planos }));
});

describe('Teste cego: ordem inicial sorteada por sessão', () => {
  it('usa o rng injetado, guarda a ordem na sessão e o F5 (nova renderização) mantém', async () => {
    const primeira = await ordemNaTela(sequencia([0.9, 0.1, 0.5, 0.3]));
    expect([...primeira].sort()).toEqual(APELIDOS);
    expect(lerSessao()?.ordemInicialCego).toEqual(primeira);

    const rngProibido = () => {
      throw new Error('F5 nao pode sortear de novo');
    };
    expect(await ordemNaTela(rngProibido)).toEqual(primeira);
  });

  it('rngs diferentes em sessões novas dão ordens diferentes', async () => {
    const a = await ordemNaTela(sequencia([0.0, 0.0, 0.0, 0.0]));
    localStorage.clear();
    const b = await ordemNaTela(sequencia([0.99, 0.99, 0.99, 0.99]));
    expect(a).not.toEqual(b);
  });

  it('sessão antiga sem a ordem inicial guardada não quebra: sorteia e guarda', async () => {
    salvarSessao({ ordemCandidatos: [], respostasQuiz: {}, finalizado: false });
    const ordem = await ordemNaTela(sequencia([0.2, 0.7, 0.4, 0.6]));
    expect([...ordem].sort()).toEqual(APELIDOS);
    expect(lerSessao()?.ordemInicialCego).toEqual(ordem);
  });

  it('a classificação da pessoa não vira a ordem inicial: aplicarOrdemTesteCego preserva a inicial', () => {
    const atual = { versao: 1 as const, ordemCandidatos: [], respostasQuiz: {}, finalizado: false, ordemInicialCego: ['b', 'a'] };
    const nova = aplicarOrdemTesteCego(atual, ['a', 'b']);
    expect(nova.ordemCandidatos).toEqual(['a', 'b']);
    expect(nova.ordemInicialCego).toEqual(['b', 'a']);
  });

  it('nomes dos cards seguem a posição sorteada e nenhum texto revela o autor', async () => {
    const tela = await renderTesteCego(sequencia([0.3, 0.8, 0.1, 0.6]));
    const nomes = Array.from(tela.querySelectorAll('.tc-card-content strong')).map((e) => e.textContent);
    expect(nomes).toEqual(['Plano 1', 'Plano 2', 'Plano 3', 'Plano 4', 'Plano 5']);
  });
});
