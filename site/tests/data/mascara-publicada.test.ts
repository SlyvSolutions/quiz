import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { createHash } from 'node:crypto';
import { mascararTexto, conferirMascaraTexto } from '../../src/core/mascarar-texto';
import { ROTULOS_PROGRAMAS } from '../../src/core/rotulos-programas';

const dados = path.join(import.meta.dirname, '../../public/data');
const ler = <T>(f: string): T => JSON.parse(fs.readFileSync(path.join(dados, f), 'utf-8')) as T;

interface T {
  id: string;
  texto_literal: string;
  texto_mascarado: string;
  hash_texto: string;
  contexto_literal?: string;
  contexto_mascarado?: string;
  hash_contexto?: string;
}
const trechos = [...ler<T[]>('trechos.json'), ...ler<T[]>('trechos_quiz.json')];
const planos = [
  ...ler<{ id: string; texto_mascarado: string; contexto_mascarado?: string }[]>('planos_cegos.json'),
  ...ler<{ id: string; texto_mascarado: string; contexto_mascarado?: string }[]>('planos_cegos_quiz.json'),
];
const sha = (s: string) => createHash('sha256').update(s).digest('hex');

describe('dados publicados e a máscara', () => {
  it('texto e contexto mascarados já saem da máscara única: nada mais a esconder', () => {
    for (const t of trechos) {
      expect(mascararTexto(t.texto_literal), `${t.id} texto`).toBe(t.texto_mascarado);
      if (t.contexto_literal !== undefined) expect(mascararTexto(t.contexto_literal), `${t.id} contexto`).toBe(t.contexto_mascarado);
    }
  });

  it('os planos cegos repetem exatamente os campos mascarados dos trechos', () => {
    const porId = new Map(trechos.map((t) => [t.id, t]));
    for (const p of planos) {
      const t = porId.get(p.id)!;
      expect(p.texto_mascarado, p.id).toBe(t.texto_mascarado);
      expect(p.contexto_mascarado, p.id).toBe(t.contexto_mascarado);
    }
  });

  it('o hash é do literal e a diferença entre literal e mascarado é só marcador ou rótulo', () => {
    for (const t of trechos) {
      expect(sha(t.texto_literal), t.id).toBe(t.hash_texto);
      if (t.contexto_literal !== undefined) expect(sha(t.contexto_literal), t.id).toBe(t.hash_contexto);
      expect(conferirMascaraTexto(t.texto_literal, t.texto_mascarado).valido, t.id).toBe(true);
    }
  });

  it('cada entrada do dicionário marcada como "publicado" na auditoria acerta mesmo algum texto literal publicado', () => {
    const auditoria = JSON.parse(
      fs.readFileSync(path.join(import.meta.dirname, '../../../docs/avaliacao/mascara-programas-auditoria.json'), 'utf-8')
    ) as { id: string; origem: string }[];
    const literais = trechos.flatMap((t) => [t.texto_literal, t.contexto_literal ?? '']);
    for (const a of auditoria.filter((x) => x.origem === 'publicado')) {
      const e = ROTULOS_PROGRAMAS.find((r) => r.id === a.id)!;
      const re = new RegExp(e.padrao, e.flags);
      expect(
        literais.some((l) => new RegExp(re.source, re.flags.replace('g', '')).test(l)),
        `entrada '${a.id}' não aparece em nenhum literal publicado`
      ).toBe(true);
    }
  });
});
