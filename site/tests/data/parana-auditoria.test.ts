import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { BaseCandidatosPRSchema } from '../../src/data/tipos';

const raiz = join(import.meta.dirname, '../..');
const base = JSON.parse(readFileSync(join(raiz, 'public/data/candidatos_pr.json'), 'utf-8'));

/**
 * Candidatos marcados para revisão sem motivo escrito (lacunas ou observações vazias).
 * Pendência de pesquisa do dev: o motivo só pode vir de quem revisou. Quando um id ganhar o motivo,
 * este teste falha de propósito para ele sair desta lista.
 */
const REVISAR_SEM_MOTIVO_PENDENTE = [
  'pr-est-14000', 'pr-est-14011', 'pr-est-14100', 'pr-est-14123', 'pr-est-14144', 'pr-est-14222', 'pr-est-14999',
  'pr-fed-1404', 'pr-fed-1426', 'pr-fed-1439', 'pr-fed-1456', 'pr-fed-1477', 'pr-fed-1499', 'pr-sen-144',
];

describe('base real do Paraná é auditável', () => {
  it('passa no schema e nunca é vazia em produção', () => {
    expect(() => BaseCandidatosPRSchema.parse(base)).not.toThrow();
    expect(base.candidatos.length).toBeGreaterThan(0);
  });

  it('todo candidato traz fonte e a origem da situação no TSE', () => {
    for (const c of base.candidatos) {
      expect(c.fontes.length, c.id).toBeGreaterThan(0);
      expect(c.situacaoTSE.trim().length, c.id).toBeGreaterThan(0);
    }
  });

  it('foto só existe se o arquivo está em public/fotos', () => {
    for (const c of base.candidatos) {
      if (!c.foto) continue;
      expect(c.foto.startsWith('fotos/'), c.id).toBe(true);
      expect(existsSync(join(raiz, 'public', c.foto)), c.id).toBe(true);
    }
  });

  it('candidato marcado para revisão diz o motivo, exceto os pendentes listados', () => {
    const semMotivo = base.candidatos
      .filter((c: { revisar: boolean; lacunas?: string[]; observacoes?: string[] }) => c.revisar && (c.lacunas?.length ?? 0) + (c.observacoes?.length ?? 0) === 0)
      .map((c: { id: string }) => c.id)
      .sort();
    expect(semMotivo).toEqual([...REVISAR_SEM_MOTIVO_PENDENTE].sort());
  });
});

describe('situação de Renan Santos (pr-pres-14)', () => {
  const renan = base.candidatos.find((c: { id: string }) => c.id === 'pr-pres-14');
  const manifesto = JSON.parse(readFileSync(join(raiz, 'public/fotos/manifest.json'), 'utf-8'));

  it('segue o TSE, que mostra Aguardando julgamento, e não diz deferida', () => {
    expect(renan.situacaoTSE).toMatch(/^Aguardando julgamento/);
    expect(renan.situacaoTSE).not.toMatch(/deferid/i);
    expect(renan.bio).not.toMatch(/deferid/i);
    expect(renan.bio).toMatch(/aguardando julgamento/i);
  });

  it('cita o TSE como fonte da situação e bate com o registro do TSE no manifesto de fotos', () => {
    expect(renan.fontes.some((f: { url: string }) => f.url.startsWith('https://divulgacandcontas.tse.jus.br'))).toBe(true);
    const registro = manifesto.find((m: { id: string }) => m.id === 'pr-pres-14');
    expect(registro.observacao).toContain('situação TSE: Aguardando julgamento');
  });
});

describe('sem chamada de campanha fora do módulo Paraná', () => {
  it('nenhuma tela além de parana traz VOTE 14, VOU VOTAR, contagem regressiva ou colinha', () => {
    const telas = join(raiz, 'src/screens');
    const proibida = /VOTE 14|VOU VOTAR|FALTAM \d+ DIAS|COLINHA/i;
    for (const pasta of readdirSync(telas)) {
      if (pasta === 'parana') continue;
      for (const arq of readdirSync(join(telas, pasta)).filter((f) => f.endsWith('.ts'))) {
        expect(readFileSync(join(telas, pasta, arq), 'utf-8'), `${pasta}/${arq}`).not.toMatch(proibida);
      }
    }
  });
});
