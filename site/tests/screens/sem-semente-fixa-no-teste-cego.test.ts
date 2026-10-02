import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ler = (rel: string) => readFileSync(fileURLToPath(new URL('../../src/' + rel, import.meta.url)), 'utf8');

describe('teste cego: nenhum texto nem codigo promete semente fixa', () => {
  it('Método, slides do Início e a tela do teste cego não citam semente fixa nem ordem igual para todos', () => {
    for (const f of ['screens/metodo/index.ts', 'screens/inicio/slides.ts', 'screens/teste-cego/index.ts']) {
      const t = ler(f);
      expect(t, f).not.toMatch(/semente fixa/i);
      expect(t, f).not.toMatch(/igual para todo mundo/i);
      expect(t, f).not.toMatch(/mesma ordem para todo mundo/i);
    }
  });

  it('a tela do teste cego não usa semente numérica nem o embaralhamento com semente', () => {
    const t = ler('screens/teste-cego/index.ts');
    expect(t).not.toMatch(/shuffleArray/);
    expect(t).not.toMatch(/12345/);
  });

  it('o Método diz que o sorteio é por sessão e guardado para o recarregamento', () => {
    const t = ler('screens/metodo/index.ts');
    expect(t).toMatch(/sorteada a cada jornada/);
    expect(t).toMatch(/recarregar a página mantém a ordem/);
  });
});
