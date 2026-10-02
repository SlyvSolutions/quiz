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

describe('texto do site sobre o tamanho do quiz', () => {
  it('nenhum texto fixa 10 perguntas, 10 trechos, 10 frases ou 2 por eixo', () => {
    for (const f of arquivos(SRC)) {
      expect(readFileSync(f, 'utf8'), f).not.toMatch(/\b(10|dez) (perguntas|trechos|frases)|\b2 por eixo|\bPasso 1 de 10\b/);
    }
  });
});
