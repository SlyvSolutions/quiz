import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { juntarPainel, carregarContrapontos } from '../../scripts/build-painel';

const dir = join(import.meta.dirname, '../../public/data');
const ler = (n: string) => JSON.parse(readFileSync(join(dir, n), 'utf-8'));

const av = (trecho_id: string, criterio_id: string, veredito: string) => ({ trecho_id, criterio_id, veredito, justificativa: 'j', fonte: 'f' });
const cp = (chave: string, contraponto: string) => ({ chave, contraponto });

describe('build-painel: join por trecho_id|criterio_id', () => {
  it('preenche outro_lado sem tocar em veredito, justificativa e fonte', () => {
    const avs = [av('x-seguranca', 'C1', 'Parcial')];
    const erros = juntarPainel([{ id: 'x-seguranca' }], avs, [
      cp('x-seguranca|C1', "Corpo (Fonte: Y). Conclusão: sustenta o veredito 'Parcial' do painel."),
    ]);
    expect(erros).toEqual([]);
    expect(avs[0]).toEqual({
      ...av('x-seguranca', 'C1', 'Parcial'),
      outro_lado: "Corpo (Fonte: Y). Conclusão: sustenta o veredito 'Parcial' do painel.",
    });
  });

  it('falha em chave órfã em vez de sumir em silêncio', () => {
    const erros = juntarPainel([{ id: 'x-seguranca' }], [], [cp('y-seguranca|C1', 'texto (Fonte: X)')]);
    expect(erros.some((e) => e.includes('ORFA'))).toBe(true);
  });

  it('falha em critério fora de C1 a C5', () => {
    const erros = juntarPainel([{ id: 'x' }], [], [cp('x|C9', 'texto (Fonte: X)')]);
    expect(erros.some((e) => e.includes('CRITERIO_INVALIDO'))).toBe(true);
  });

  it('falha quando o contraponto não traz fonte no corpo', () => {
    const avs = [av('x', 'C1', 'Parcial')];
    const erros = juntarPainel([{ id: 'x' }], avs, [cp('x|C1', "Conclusão: sustenta o veredito 'Parcial' do painel.")]);
    expect(erros.some((e) => e.includes('SEM_FONTE'))).toBe(true);
    expect(avs[0]).not.toHaveProperty('outro_lado');
  });

  it('falha quando uma avaliação fica sem contraponto', () => {
    const erros = juntarPainel([{ id: 'x' }], [av('x', 'C1', 'Parcial')], []);
    expect(erros.some((e) => e.includes('SEM_CONTRAPONTO'))).toBe(true);
  });

  it('falha quando o contraponto cita veredito diferente do publicado (pós-duelo)', () => {
    const avs = [av('x-seguranca', 'C1', 'Parcial')];
    const erros = juntarPainel([{ id: 'x-seguranca' }], avs, [
      cp('x-seguranca|C1', "Conclusão: confirma o veredito 'Sem base para avaliar' do painel. (Fonte: X)"),
    ]);
    expect(erros.some((e) => e.includes('VEREDITO_DIVERGENTE'))).toBe(true);
    expect(avs[0]).not.toHaveProperty('outro_lado');
  });

  it('aceita conclusão que não cita o veredito pelo nome', () => {
    const erros = juntarPainel([{ id: 'x' }], [av('x', 'C1', 'Parcial')], [cp('x|C1', 'Corpo (Fonte: X). Conclusão: confirma o veredito do painel.')]);
    expect(erros).toEqual([]);
  });
});

/** Dados reais. A pesquisa em pesquisa/contrapontos-viabilidade.json tem 125 chaves, todas com corpo, fonte e conclusão do veredito vigente. */
describe('build-painel com os dados reais', () => {
  const trechos = ler('trechos.json');
  const reais = () => ler('avaliacoes.json');

  it('todo trecho do Comparador tem os 5 contrapontos e nenhuma chave fica órfã ou com veredito divergente', () => {
    const erros = juntarPainel(trechos, reais(), carregarContrapontos());
    const graves = erros.filter((e) => !e.startsWith('SEM_FONTE'));
    expect(graves).toEqual([]);
  });

  it('o join dos 125 não tem erro e nenhum fica sem fonte', () => {
    expect(juntarPainel(trechos, reais(), carregarContrapontos())).toEqual([]);
  });

  it('as 125 avaliações publicadas recebem outro_lado, com fonte', () => {
    const avs = reais();
    const erros = juntarPainel(trechos, avs, carregarContrapontos());
    expect(erros).toEqual([]);
    expect(avs.filter((a: { outro_lado?: string }) => a.outro_lado?.includes('(Fonte:'))).toHaveLength(125);
  });
});
