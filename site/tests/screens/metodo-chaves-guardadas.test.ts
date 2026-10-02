import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = fileURLToPath(new URL('../../src/', import.meta.url));

function arquivos(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? arquivos(p) : p.endsWith('.ts') ? [p] : [];
  });
}

const metodo = join(SRC, 'screens/metodo/index.ts');
const chavesDoCodigo = new Set<string>();
const chavesDoMetodo = new Set<string>();
for (const f of arquivos(SRC)) {
  const texto = readFileSync(f, 'utf8');
  for (const m of texto.matchAll(/['"`](mq\.[a-z]+\.[a-z0-9]+)['"`]/g)) {
    (f === metodo ? chavesDoMetodo : chavesDoCodigo).add(m[1]!);
  }
}

describe('chaves de armazenamento do Método', () => {
  it('as chaves que o código grava são exatamente as declaradas no Método', () => {
    expect([...chavesDoMetodo].sort()).toEqual([...chavesDoCodigo].sort());
    expect([...chavesDoCodigo].sort()).toEqual(['mq.sessao.v1', 'mq.wizard.slide']);
  });

  it('nenhum texto do site fala em subtemas vistos nem na chave mq.vistos', () => {
    for (const f of arquivos(SRC)) {
      const texto = readFileSync(f, 'utf8');
      expect(texto, f).not.toMatch(/mq\.vistos|subtemas vistos|lerVistos|marcarVistos|limparVistos/);
    }
  });
});
