// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';

vi.mock('../../src/app/router', () => ({ navigate: vi.fn() }));
import { renderMetodo } from '../../src/screens/metodo/index';

const pacote = JSON.parse(readFileSync('package.json', 'utf-8'));
const deploy = readFileSync('../.github/workflows/deploy.yml', 'utf-8');

beforeEach(() => {
  document.body.replaceChildren();
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, json: async () => ({}) })));
});

describe('Método: verificações iguais ao que o build roda', () => {
  it('lista toda a cadeia do npm run verificar, na ordem do package.json', async () => {
    const cadeia = [...(pacote.scripts.verificar as string).matchAll(/scripts\/([\w-]+)\.ts/g)].map((m) => m[1]!);
    const texto = (await renderMetodo()).querySelector('#metodo-verificacoes')?.textContent ?? '';
    for (const nome of cadeia) expect(texto, nome).toContain(nome);
    expect(texto).toMatch(/cadeia do build/i);
  });

  it('não diz que só um verificador roda no build', async () => {
    const texto = (await renderMetodo()).querySelector('#metodo-verificacoes')?.textContent ?? '';
    expect(texto).not.toMatch(/Só o primeiro roda/);
  });

  it('diz que a publicação roda npm run build e, por ser o que o workflow faz, que os testes não rodam lá', async () => {
    expect(deploy).toMatch(/run: npm run build/);
    expect(deploy).not.toMatch(/npm test|vitest/);
    const texto = (await renderMetodo()).querySelector('#metodo-verificacoes')?.textContent ?? '';
    expect(texto).toMatch(/publicação roda apenas/i);
    expect(texto).toMatch(/testes automáticos.*não rodam na publicação/i);
  });
});

describe('Método: verificador do quiz por subtemas', () => {
  it('exige 3 subtemas por assunto, como o quiz usa', async () => {
    const texto = (await renderMetodo()).querySelector('#metodo-verificacoes')?.textContent ?? '';
    expect(texto).toMatch(/ao menos 3 subtemas com 3 ou mais candidatos/);
    expect(texto).not.toMatch(/ao menos 2 subtemas/);
  });
});

describe('Método: igualdade de aparições', () => {
  it('não fixa o limite de trechos por candidato num número que envelhece', async () => {
    const texto = (await renderMetodo()).textContent ?? '';
    expect(texto).toMatch(/Igualdade de aparições/);
    expect(texto).not.toMatch(/hoje,\s*\d+/);
    expect(texto).toMatch(/limite é o candidato com menos trechos nos planos(?!\s*\()/);
  });
});
