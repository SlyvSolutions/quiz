import { z } from 'zod';
import { carregarJSON } from './carregar';

export const CandidatoPublicoSchema = z.object({
  id: z.string(),
  nome: z.string(),
  partido: z.string(),
});
export type CandidatoPublico = z.infer<typeof CandidatoPublicoSchema>;

/** Nome e partido de cada candidato, por id. Vem de data/candidatos.json (gerado de pesquisa/candidatos.json). */
export type NomesCandidatos = Record<string, { nome: string; partido: string }>;

/** Lança ErroCargaDados se o arquivo faltar ou vier fora do formato: as telas mostram o erro, sem nomes de reserva. */
export async function carregarCandidatos(): Promise<NomesCandidatos> {
  const lista = await carregarJSON(import.meta.env.BASE_URL + 'data/candidatos.json', z.array(CandidatoPublicoSchema));
  const nomes: NomesCandidatos = {};
  for (const c of lista) nomes[c.id] = { nome: c.nome, partido: c.partido };
  return nomes;
}
