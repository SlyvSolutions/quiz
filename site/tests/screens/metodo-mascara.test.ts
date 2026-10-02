// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/app/router', () => ({ navigate: vi.fn() }));
import { renderMetodo } from '../../src/screens/metodo/index';
import { ROTULOS_PROGRAMAS } from '../../src/core/rotulos-programas';

beforeEach(() => {
  document.body.replaceChildren();
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, json: async () => ({}) })));
});

const secao = async (id: string) => (await renderMetodo()).querySelector(`#metodo-${id}`)?.textContent ?? '';

describe('Método: política de máscara (mascarado na escolha, original no Resultado)', () => {
  it('diz que na escolha o eleitor não pode reconhecer o autor e que o original só aparece no Resultado', async () => {
    const t = await secao('teste-cego');
    expect(t).toMatch(/na hora de escolher|durante a escolha/i);
    expect(t).toMatch(/texto original.*só.*Resultado|só no Resultado/i);
    expect(t).toMatch(/verso do card.*justificativas mascaradas|justificativas mascaradas.*verso do card/i);
    expect(t).toMatch(/a fonte da avaliação não aparece/i);
  });

  it('lista o que a máscara cobre: identificadores diretos, cabeçalhos, autorreferência e programas por rótulo neutro', async () => {
    const t = await secao('teste-cego');
    for (const termo of ['nomes de candidatos', 'partidos', 'estado-sede', 'cabeçalhos e rodapés', 'nomes de políticos', 'nosso governo', 'rótulo neutro']) {
      expect(t.toLowerCase(), termo).toContain(termo.toLowerCase());
    }
    expect(t).toContain('[programa federal de atenção médica]');
  });

  it('diz que o dicionário de programas é versionado e igual para os cinco candidatos, e quantas entradas tem', async () => {
    const t = await secao('teste-cego');
    expect(t).toMatch(/dicionário versionado/i);
    expect(t).toMatch(/igual para os cinco candidatos/i);
    expect(t).toContain(`${ROTULOS_PROGRAMAS.length} entradas`);
  });

  it('diz o que a máscara não cobre: normas, instituições, dados e fontes, e o estilo do texto', async () => {
    const t = await secao('teste-cego');
    expect(t).toMatch(/não esconde/i);
    for (const termo of ['leis', 'artigos da Constituição', 'instituições públicas', 'dados e fontes', 'estilo']) {
      expect(t, termo).toContain(termo);
    }
    expect(t).toMatch(/não garante anonimato absoluto/i);
  });

  it('nao afirma mais que só nomes e partidos viram [***] nem que programas ficam à vista', async () => {
    const t = await secao('teste-cego');
    expect(t).not.toContain('Só duas coisas viram');
    expect(t).not.toContain('Ela só troca os nomes da lista acima');
    expect(t).not.toMatch(/não disfarça[^.]*os programas/i);
  });

  it('as verificações citam o verificador de programas e identificadores', async () => {
    const t = await secao('verificacoes');
    expect(t).toContain('verificar-programas');
  });
});
