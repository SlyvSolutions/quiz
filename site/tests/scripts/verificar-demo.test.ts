import { describe, it, expect } from 'vitest';
import { validarDemo } from '../../scripts/verificar-demo';
import type { Trecho, AvaliacaoViabilidade } from '../../src/data/tipos';

const trecho = (id: string, texto = 'Texto literal do plano'): Trecho => ({
  id, candidato_id: 'c1', eixo: 'Segurança', arquivo: 'Plano.md',
  linha_inicio: 1, linha_fim: 1, texto_literal: texto, texto_mascarado: texto,
  hash_texto: '',
});

function comHash(t: Trecho): Trecho {
  const { createHash } = require('node:crypto');
  return { ...t, hash_texto: createHash('sha256').update(t.texto_literal).digest('hex') };
}

describe('verificar-demo', () => {
  it('aprova demo disjunto, literal e com hash certo', () => {
    const t = comHash(trecho('demo-a'));
    const erros = validarDemo([t], [], ['jogo-1'], () => 'Texto literal do plano em volta');
    expect(erros).toHaveLength(0);
  });

  it('barra id que está nos jogos', () => {
    const t = comHash(trecho('jogo-1'));
    const erros = validarDemo([t], [], ['jogo-1'], () => t.texto_literal);
    expect(erros.some((e) => e.includes('TRECHO_NOS_JOGOS'))).toBe(true);
  });

  it('barra texto que não está no plano e hash divergente', () => {
    const t: Trecho = { ...trecho('demo-b'), hash_texto: 'errado' };
    const erros = validarDemo([t], [], [], () => 'outro conteúdo');
    expect(erros.some((e) => e.includes('TRECHO_NAO_LITERAL'))).toBe(true);
    expect(erros.some((e) => e.includes('HASH_DIVERGENTE'))).toBe(true);
  });

  it('barra avaliação órfã', () => {
    const t = comHash(trecho('demo-a'));
    const av: AvaliacaoViabilidade = { criterio_id: 'C1', trecho_id: 'fantasma', veredito: 'Viável', justificativa: 'j', fonte: 'f' };
    const erros = validarDemo([t], [av], [], () => t.texto_literal);
    expect(erros.some((e) => e.includes('AVALIACAO_ORFA'))).toBe(true);
  });
});
