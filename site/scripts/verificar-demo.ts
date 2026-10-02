import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import { conferirMascara } from '../src/core/mascara';
import type { Trecho, AvaliacaoViabilidade } from '../src/data/tipos';

/**
 * O pool do demo (deck S3) é disjunto dos jogos: nenhum trecho sorteado
 * pode aparecer no teste cego ou no quiz, para não vazar o teste cego.
 */
export function validarDemo(
  demo: Trecho[],
  avaliacoesDemo: AvaliacaoViabilidade[],
  idsDosJogos: string[],
  lerPlano: (arquivo: string) => string | null
): string[] {
  const erros: string[] = [];
  const norm = (s: string) => s.replace(/\s+/g, ' ').trim();
  const idsDemo = new Set(demo.map((t) => t.id));

  for (const t of demo) {
    if (idsDosJogos.includes(t.id)) {
      erros.push(`[${t.id}] TRECHO_NOS_JOGOS: o demo não pode usar trecho dos jogos (vaza o teste cego).`);
    }
    const plano = lerPlano(t.arquivo);
    if (plano === null) {
      erros.push(`[${t.id}] PLANO_INEXISTENTE: ${t.arquivo} não encontrado.`);
    } else if (!norm(plano).includes(norm(t.texto_literal))) {
      erros.push(`[${t.id}] TRECHO_NAO_LITERAL: texto não achado em ${t.arquivo} (ipsis litteris).`);
    }
    if (!conferirMascara(t.texto_literal, t.texto_mascarado).valido) {
      erros.push(`[${t.id}] MASCARA_FORA_DO_PADRAO: diferença além dos marcadores.`);
    }
    const hash = crypto.createHash('sha256').update(t.texto_literal).digest('hex');
    if (hash !== t.hash_texto) {
      erros.push(`[${t.id}] HASH_DIVERGENTE: hash_texto não bate com o literal.`);
    }
    if (t.texto_mascarado.length > 280) {
      erros.push(`[${t.id}] TRECHO_LONGO: ${t.texto_mascarado.length} caracteres (máx 280 para o deck).`);
    }
  }

  for (const a of avaliacoesDemo) {
    if (!idsDemo.has(a.trecho_id)) {
      erros.push(`[${a.trecho_id}] AVALIACAO_ORFA: avaliação de trecho fora do demo.`);
    }
  }

  return erros;
}

if (process.env.VITEST !== 'true' && process.env.NODE_ENV !== 'test') {
  console.log('Verificando disjunção do demo...');
  const base = path.join(import.meta.dirname, '..');
  const ler = (p: string) => JSON.parse(fs.readFileSync(path.join(base, p), 'utf-8'));
  const demo: Trecho[] = ler('public/data/trechos_demo.json');
  const avaliacoesDemo: AvaliacaoViabilidade[] = ler('public/data/avaliacoes_demo.json');
  const jogos: string[] = (ler('public/data/trechos.json') as Trecho[]).map((t) => t.id);
  const lerPlano = (arquivo: string) => {
    const p = path.join(base, '..', 'Planos_TSE', arquivo);
    return fs.existsSync(p) ? fs.readFileSync(p, 'utf-8') : null;
  };
  const erros = validarDemo(demo, avaliacoesDemo, jogos, lerPlano);
  if (erros.length > 0) {
    console.error('❌ Falha na validação do demo (código != 0):');
    erros.forEach((e) => console.error(e));
    process.exit(1);
  } else {
    console.log('✅ Demo disjunto dos jogos, literais conferidos.');
    process.exit(0);
  }
}
