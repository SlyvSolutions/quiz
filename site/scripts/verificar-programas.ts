import * as fs from 'node:fs';
import * as path from 'node:path';
import { mascararTexto, termosRemanescentes } from '../src/core/mascarar-texto';

/**
 * Política de máscara: durante a escolha (teste cego e quiz) o eleitor não pode reconhecer o autor.
 * Falha se algum termo do dicionário de programas ou identificador direto aparecer:
 *  - nos campos mascarados (texto_mascarado e contexto_mascarado) de trechos e de planos cegos;
 *  - no que o quiz mostra antes do Resultado: a justificativa (mascarada em tempo de execução) e a fonte
 *    (que o quiz não pode ler, porque o nome do arquivo do plano revela o autor).
 */
export interface DadosProgramas {
  trechos: { id: string; texto_mascarado: string; contexto_mascarado?: string }[];
  planos: { id: string; texto_mascarado: string; contexto_mascarado?: string }[];
  avaliacoes: { trecho_id: string; criterio_id: string; justificativa: string }[];
  /** código-fonte das telas e componentes mostrados antes do Resultado (quiz e verso do card) */
  fontesDoQuiz: string[];
}

export function validarProgramas(d: DadosProgramas): string[] {
  const erros: string[] = [];
  const conferir = (origem: string, id: string, campo: string, texto: string | undefined) => {
    if (!texto) return;
    for (const termo of new Set(termosRemanescentes(texto))) {
      erros.push(`[${id}] TERMO_NA_MASCARA: '${termo}' em ${origem}.${campo} ainda identifica o autor ou um programa.`);
    }
  };
  for (const t of d.trechos) {
    conferir('trechos', t.id, 'texto_mascarado', t.texto_mascarado);
    conferir('trechos', t.id, 'contexto_mascarado', t.contexto_mascarado);
  }
  for (const p of d.planos) {
    conferir('planos_cegos', p.id, 'texto_mascarado', p.texto_mascarado);
    conferir('planos_cegos', p.id, 'contexto_mascarado', p.contexto_mascarado);
  }
  // O que o verso do quiz exibe da avaliação: a justificativa já mascarada
  for (const a of d.avaliacoes) {
    conferir('avaliacoes_quiz', `${a.trecho_id}/${a.criterio_id}`, 'justificativa (mascarada)', mascararTexto(a.justificativa));
  }
  for (const [i, fonte] of d.fontesDoQuiz.entries()) {
    if (/\.fonte\b/.test(fonte)) {
      erros.push(`[fonte-${i}] FONTE_NO_QUIZ: o quiz lê o campo fonte da avaliação; o nome do arquivo do plano revela o autor.`);
    }
  }
  return erros;
}

if (process.env.VITEST !== 'true' && process.env.NODE_ENV !== 'test') {
  console.log('Verificando programas e identificadores nos textos mascarados...');
  const base = path.join(import.meta.dirname, '..');
  const ler = (p: string) => JSON.parse(fs.readFileSync(path.join(base, p), 'utf-8'));
  const dados: DadosProgramas = {
    trechos: [...ler('public/data/trechos.json'), ...ler('public/data/trechos_quiz.json')],
    planos: [...ler('public/data/planos_cegos.json'), ...ler('public/data/planos_cegos_quiz.json')],
    avaliacoes: ler('public/data/avaliacoes_quiz.json'),
    fontesDoQuiz: ['src/screens/quiz/index.ts', 'src/ui/slide-criterios.ts'].map((p) => fs.readFileSync(path.join(base, p), 'utf-8')),
  };
  const erros = validarProgramas(dados);
  if (erros.length > 0) {
    console.error('Falha na verificação de programas (código != 0):');
    erros.forEach((e) => console.error(e));
    process.exit(1);
  }
  console.log(`OK: nenhum termo do dicionário nem identificador direto nos textos mascarados (${dados.trechos.length} trechos, ${dados.planos.length} planos, ${dados.avaliacoes.length} justificativas).`);
  process.exit(0);
}
