import * as fs from 'node:fs';
import * as path from 'node:path';
import { conferirMascaraTexto } from '../src/core/mascarar-texto';
import type { Trecho } from '../src/data/tipos';

export function validarMascaras(trechos: Trecho[]): string[] {
  const erros: string[] = [];

  for (const t of trechos) {
    const resultado = conferirMascaraTexto(t.texto_literal, t.texto_mascarado);
    if (!resultado.valido) {
      erros.push(`[${t.id}] MASCARA_FORA_DO_PADRAO: A diferença entre literal e mascarado vai além dos marcadores.`);
    }

    // O contexto (parágrafo em volta) também aparece na tela do teste cego: mesma regra do trecho
    if (t.contexto_literal !== undefined && t.contexto_mascarado !== undefined) {
      const ctx = conferirMascaraTexto(t.contexto_literal, t.contexto_mascarado);
      if (!ctx.valido) {
        erros.push(`[${t.id}] CONTEXTO_MASCARA_FORA_DO_PADRAO: A diferença entre contexto literal e mascarado vai além dos marcadores.`);
      }
    }
  }

  return erros;
}

if (process.env.VITEST !== 'true' && process.env.NODE_ENV !== 'test') {
  console.log('Verificando integridade das máscaras...');
  
  const trechosPath = path.join(import.meta.dirname, '../public/data/trechos.json');

  if (!fs.existsSync(trechosPath)) {
    console.error('ARQUIVO_INEXISTENTE: O arquivo de trechos não foi encontrado em ' + trechosPath);
    process.exit(1);
  }

  let trechos: Trecho[];
  try {
    trechos = JSON.parse(fs.readFileSync(trechosPath, 'utf-8'));
  } catch (e: any) {
    console.error('Erro ao parsear trechos.json:', e.message);
    process.exit(1);
  }

  const erros = validarMascaras(trechos);

  if (erros.length > 0) {
    console.error('❌ Falha na validação de máscaras (código != 0):');
    erros.forEach(e => console.error(e));
    process.exit(1);
  } else {
    console.log('✅ Todas as máscaras foram validadas com sucesso.');
    process.exit(0);
  }
}
