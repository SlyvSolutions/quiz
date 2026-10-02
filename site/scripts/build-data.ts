import fs from 'fs';
import path from 'path';
import { CandidatoPublicoSchema } from '../src/data/candidatos';

const dataDir = path.join(import.meta.dirname, '../public/data');
const trechosPath = path.join(dataDir, 'trechos.json');

const trechosStr = fs.readFileSync(trechosPath, 'utf-8');
const trechos = JSON.parse(trechosStr);

// T-023: planos_cegos.json
// done_when: o JSON possui apenas o id interno, apelido neutro (ex: Candidato A), o eixo e os trechos mascarados; nenhum nome real vaza

const cands = [...new Set(trechos.map((t: any) => t.candidato_id))];
const aliases = ['Candidato A', 'Candidato B', 'Candidato C', 'Candidato D', 'Candidato E'];
const candToAlias: Record<string, string> = {};
cands.forEach((c: any, i) => { candToAlias[c] = aliases[i] ?? `Candidato ${i + 1}`; });

const planosCegos = trechos.map((t: any) => ({
  id: t.id,
  apelido_neutro: candToAlias[t.candidato_id],
  eixo: t.eixo,
  texto_mascarado: t.texto_mascarado,
  contexto_mascarado: t.contexto_mascarado
}));

fs.writeFileSync(path.join(dataDir, 'planos_cegos.json'), JSON.stringify(planosCegos, null, 2));
console.log('✅ planos_cegos.json gerado.');

// T-026: candidatos.json
// done_when: o JSON possui 5 entradas com id, nome e partido, copiadas de pesquisa/candidatos.json (fonte única)
const candidatosFonte = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, '../../pesquisa/candidatos.json'), 'utf-8'));
const candidatos = CandidatoPublicoSchema.array().parse(candidatosFonte.candidatos);
if (candidatos.length !== 5) {
  console.error(`CANDIDATOS_INVALIDOS: esperado 5, encontrado ${candidatos.length}`);
  process.exit(1);
}
fs.writeFileSync(path.join(dataDir, 'candidatos.json'), JSON.stringify(candidatos, null, 2));
console.log('✅ candidatos.json gerado.');
