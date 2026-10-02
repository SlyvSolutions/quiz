// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { carregarCandidatos } from '../../src/data/candidatos';
import { ErroCargaDados } from '../../src/data/carregar';

const dir = join(import.meta.dirname, '../../public/data');
const publicado = JSON.parse(readFileSync(join(dir, 'candidatos.json'), 'utf-8'));
const pesquisa = JSON.parse(readFileSync(join(import.meta.dirname, '../../../pesquisa/candidatos.json'), 'utf-8'));
const trechos = JSON.parse(readFileSync(join(dir, 'trechos.json'), 'utf-8'));

afterEach(() => vi.unstubAllGlobals());

describe('candidatos.json publicado', () => {
  it('é cópia exata do que a pesquisa registra e tem os 5 candidatos', () => {
    expect(publicado).toEqual(pesquisa.candidatos);
    expect(publicado).toHaveLength(5);
  });

  it('cobre todo candidato_id dos trechos do teste cego, sem sobra', () => {
    const ids = [...new Set(trechos.map((t: { candidato_id: string }) => t.candidato_id))].sort();
    expect(publicado.map((c: { id: string }) => c.id).sort()).toEqual(ids);
  });
});

describe('carregarCandidatos', () => {
  it('devolve nome e partido por id', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => publicado })));
    const nomes = await carregarCandidatos();
    expect(nomes['lula']).toEqual({ nome: 'Lula', partido: 'PT' });
    expect(Object.keys(nomes)).toEqual(publicado.map((c: { id: string }) => c.id));
  });

  it('falha em voz alta quando o arquivo não vem, sem nomes de reserva', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 404, statusText: 'x', json: async () => ({}) })));
    await expect(carregarCandidatos()).rejects.toBeInstanceOf(ErroCargaDados);
  });

  it('falha quando o formato está errado', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => [{ id: 'x' }] })));
    await expect(carregarCandidatos()).rejects.toBeInstanceOf(ErroCargaDados);
  });
});

describe('partido do Caiado: um dado só, conforme o plano depositado no TSE', () => {
  const caiado = publicado.find((c: { id: string }) => c.id === 'caiado');
  const plano = readFileSync(join(import.meta.dirname, '../../../Planos_TSE/Caiado_Plano_Original.md'), 'utf-8');

  it('é PSD, como no cabeçalho do plano oficial, e a pesquisa não guarda pendência sobre isso', () => {
    expect(plano).toContain('Plano de Governo 2027 a 2030 · PSD · Caiado e Kassab');
    expect(caiado.partido).toBe('PSD');
    expect(pesquisa.pendencias ?? []).toEqual([]);
  });

  it('os mocks de teste das telas usam o mesmo partido', () => {
    for (const arq of ['screens/comparador-aviso.test.ts', 'screens/compartilhar.test.ts', 'screens/resultado.test.ts']) {
      const t = readFileSync(join(import.meta.dirname, '..', arq), 'utf-8');
      expect(t, arq).not.toMatch(/caiado[^\n]*União Brasil/);
    }
  });
});
