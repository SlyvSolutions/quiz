import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

function arquivos(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? arquivos(p) : [p];
  });
}

describe('nenhuma tela mostra "revisão jurídica" ao eleitor', () => {
  it('o código do site (src) e os dados publicados não trazem a expressão', () => {
    const alvos = [...arquivos('src').filter((f) => /\.(ts|css|html)$/.test(f)), 'index.html'];
    for (const dir of ['public/data']) alvos.push(...arquivos(dir).filter((f) => f.endsWith('.json')));
    const achados = alvos.filter((f) => /revis[aã]o jur[ií]dica|revisao juridica/i.test(readFileSync(f, 'utf8')));
    expect(achados).toEqual([]);
  });
});
