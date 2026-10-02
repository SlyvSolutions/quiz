import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const ler = (nome: string) => JSON.parse(readFileSync(`public/data/${nome}`, 'utf-8'));

const subtemas = ler('subtemas.json') as { id: string; eixo: string }[];
const trechos = ler('trechos_quiz.json') as { id: string; subtema_id: string }[];
const planos = ler('planos_cegos_quiz.json') as { id: string; subtema_id: string }[];
const avaliacoes = ler('avaliacoes_quiz.json') as { trecho_id: string; criterio_id: string; veredito: string }[];
const originais = ler('trechos.json') as { id: string }[];
const demos = ler('trechos_demo.json') as { id: string }[];
const avaliacoesSite = ler('avaliacoes.json') as { trecho_id: string; criterio_id: string; veredito: string }[];
const avaliacoesDemo = ler('avaliacoes_demo.json') as { trecho_id: string; criterio_id: string; veredito: string }[];

const INTERNOS = ['provisorio', 'revisar_dev', 'pendente_pesquisa', 'dossie', 'dossiê', 'agente', 'juiz', 'defensor'];

function cincoPorTrecho(lista: { trecho_id: string; criterio_id: string }[], ids: string[]) {
  for (const id of ids) {
    const c = lista.filter((a) => a.trecho_id === id).map((a) => a.criterio_id).sort();
    expect(c, id).toEqual(['C1', 'C2', 'C3', 'C4', 'C5']);
  }
}

describe('dados publicados do quiz por subtemas', () => {
  it('tem 15 subtemas, 3 por assunto, e ids coerentes entre os arquivos', () => {
    expect(subtemas).toHaveLength(15);
    const ids = new Set(subtemas.map((s) => s.id));
    expect(trechos.every((t) => ids.has(t.subtema_id))).toBe(true);
    expect(planos.map((p) => p.id).sort()).toEqual(trechos.map((t) => t.id).sort());
  });

  it('cada trecho do quiz tem exatamente 5 avaliações', () => {
    expect(trechos).toHaveLength(67);
    cincoPorTrecho(avaliacoes, trechos.map((t) => t.id));
    expect(avaliacoes).toHaveLength(67 * 5);
  });

  it('o plano cego do quiz não traz o autor', () => {
    for (const p of planos) expect(Object.keys(p)).not.toContain('candidato_id');
  });
});

describe('avaliações publicadas do site', () => {
  it('os 25 trechos e os 5 demos têm 5 avaliações cada', () => {
    expect(originais).toHaveLength(25);
    cincoPorTrecho(avaliacoesSite, originais.map((t) => t.id));
    cincoPorTrecho(avaliacoesDemo, demos.map((t) => t.id));
    expect(avaliacoesSite).toHaveLength(125);
    expect(avaliacoesDemo).toHaveLength(demos.length * 5);
  });

  it('nenhum arquivo publica "Inviável", campos internos ou termos de trabalho', () => {
    const todos = [...avaliacoes, ...avaliacoesSite, ...avaliacoesDemo];
    expect(todos.some((a) => a.veredito.startsWith('Inviável'))).toBe(false);
    // outro_lado é o único campo opcional: vem do join de build-painel (só no avaliacoes.json do Comparador)
    for (const a of todos) expect(Object.keys(a).filter((k) => k !== 'outro_lado').sort()).toEqual(['criterio_id', 'fonte', 'justificativa', 'trecho_id', 'veredito']);
    const texto = JSON.stringify(todos).toLowerCase();
    for (const termo of INTERNOS) expect(texto, termo).not.toContain(`"${termo}"`);
  });
});
