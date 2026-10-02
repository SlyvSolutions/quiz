import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { AvaliacaoViabilidadeSchema } from '../../src/data/tipos';

const dir = join(import.meta.dirname, '../../public/data');
const ler = (n: string) => JSON.parse(readFileSync(join(dir, n), 'utf-8'));

describe('avaliações publicadas: fonte e justificativa', () => {
  for (const arquivo of ['avaliacoes.json', 'avaliacoes_demo.json', 'avaliacoes_quiz.json']) {
    it(`${arquivo}: schema válido, Difícil e Inviável só com fonte e justificativa, sem fonte só "Sem base"`, () => {
      const avs = ler(arquivo);
      expect(avs.length).toBeGreaterThan(0);
      for (const a of avs) {
        expect(() => AvaliacaoViabilidadeSchema.parse(a)).not.toThrow();
        if (a.veredito === 'Difícil' || a.veredito === 'Inviável nos termos propostos') {
          expect(a.fonte.trim().length, `${a.trecho_id}|${a.criterio_id}`).toBeGreaterThan(10);
          expect(a.justificativa.trim().length, `${a.trecho_id}|${a.criterio_id}`).toBeGreaterThan(10);
        }
        if (!a.fonte.trim()) expect(a.veredito, `${a.trecho_id}|${a.criterio_id}`).toBe('Sem base para avaliar');
      }
    });
  }

  it('nenhuma avaliação publicada traz "Inviável nos termos propostos" (exige revisão jurídica)', () => {
    for (const arquivo of ['avaliacoes.json', 'avaliacoes_demo.json', 'avaliacoes_quiz.json']) {
      expect(ler(arquivo).filter((a: { veredito: string }) => a.veredito === 'Inviável nos termos propostos'), arquivo).toEqual([]);
    }
  });
});
