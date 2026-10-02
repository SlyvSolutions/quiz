import { describe, it, expect } from 'vitest';
import { SubtemaSchema, TrechoQuizSchema, PlanoCegoQuizSchema } from '../../src/data/tipos';

describe('schemas do quiz', () => {
  it('aceita um subtema completo', () => {
    const r = SubtemaSchema.safeParse({
      id: 'saude-filas-regulacao',
      eixo: 'Saúde',
      nome: 'Filas',
      enunciado: 'Qual proposta?',
    });
    expect(r.success).toBe(true);
  });

  it('recusa subtema sem enunciado', () => {
    expect(SubtemaSchema.safeParse({ id: 'x', eixo: 'Saúde', nome: 'X' }).success).toBe(false);
  });

  it('trecho do quiz exige subtema_id', () => {
    const base = {
      id: 'lula-x',
      candidato_id: 'lula',
      eixo: 'Saúde',
      arquivo: 'a.md',
      linha_inicio: 1,
      linha_fim: 2,
      pagina_pdf: 3,
      texto_literal: 't',
      texto_mascarado: 't',
      hash_texto: 'h',
    };
    expect(TrechoQuizSchema.safeParse(base).success).toBe(false);
    expect(TrechoQuizSchema.safeParse({ ...base, subtema_id: 'saude-filas-regulacao' }).success).toBe(true);
  });

  it('plano cego do quiz aceita contexto ausente', () => {
    const r = PlanoCegoQuizSchema.safeParse({
      id: 'a',
      apelido_neutro: 'Candidato A',
      eixo: 'Saúde',
      subtema_id: 's',
      texto_mascarado: 't',
    });
    expect(r.success).toBe(true);
  });

  it('plano cego do quiz exige subtema_id', () => {
    const r = PlanoCegoQuizSchema.safeParse({ id: 'a', apelido_neutro: 'Candidato A', eixo: 'Saúde', texto_mascarado: 't' });
    expect(r.success).toBe(false);
  });
});
