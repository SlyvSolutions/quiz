import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

const dir = path.join(__dirname, '../../public/data');
const ler = (nome: string) => JSON.parse(fs.readFileSync(path.join(dir, nome), 'utf8'));

describe('consistência dos dados publicados', () => {
  const trechos: { id: string }[] = ler('trechos.json');
  const ids = new Set(trechos.map((t) => t.id));

  it('toda avaliação de viabilidade aponta para um trecho que existe', () => {
    const orfas = (ler('avaliacoes.json') as { trecho_id: string }[]).filter((a) => !ids.has(a.trecho_id)).map((a) => a.trecho_id);
    expect([...new Set(orfas)]).toEqual([]);
  });

  it('todo trecho tem as cinco avaliações, uma por critério', () => {
    const avaliacoes = ler('avaliacoes.json') as { trecho_id: string; criterio_id: string }[];
    for (const id of ids) {
      const criterios = avaliacoes.filter((a) => a.trecho_id === id).map((a) => a.criterio_id);
      expect(new Set(criterios).size, id).toBe(5);
    }
  });

  it('todo plano cego aponta para um trecho que existe', () => {
    const orfaos = (ler('planos_cegos.json') as { id: string }[]).filter((p) => !ids.has(p.id));
    expect(orfaos).toEqual([]);
  });
});
