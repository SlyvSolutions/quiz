import { z } from 'zod';
import { carregarJSON } from '../../data/carregar';
import { TrechoSchema, AvaliacaoViabilidadeSchema, type Trecho, type AvaliacaoViabilidade } from '../../data/tipos';

export interface CandidatoSorteio {
  id: string;
  nome: string;
}

export const CANDIDATOS: CandidatoSorteio[] = [
  { id: 'lula', nome: 'Lula' },
  { id: 'flavio', nome: 'Flávio Bolsonaro' },
  { id: 'caiado', nome: 'Ronaldo Caiado' },
  { id: 'cury', nome: 'Augusto Cury' },
  { id: 'renan', nome: 'Renan Santos' },
];

/** Nomes dos 5 critérios da régua (espelho de criterios.json, sem rede). */
export const NOMES_CRITERIOS: Record<string, string> = {
  C1: 'Fonte de recurso declarada',
  C2: 'Mudança constitucional ou legal',
  C3: 'Dependência do Congresso',
  C4: 'Precedente ou evidência',
  C5: 'Prazo declarado',
};

/** Tamanho máximo do trecho exibido no deck, para caber na viewport sem rolagem. */
export const TAMANHO_MAX_EXEMPLO = 280;

export interface ExemploSorteado {
  trecho: Trecho;
  nomeCandidato: string;
  /** As 5 avaliações do trecho do demo (vazio se o dado não carregou). */
  avaliacoes: AvaliacaoViabilidade[];
}

export function sortearIndice(total: number, rng: () => number = Math.random): number {
  return Math.floor(rng() * total);
}

/** Escolhe um trecho exibível ao acaso (sorteio de verdade) e junta as 5 avaliações dele. Mesma régua para os cinco candidatos. */
export function escolherExemplo(
  trechos: Trecho[],
  rng: () => number = Math.random,
  avaliacoes: AvaliacaoViabilidade[] = []
): ExemploSorteado | null {
  const exibiveis = trechos.filter((t) => t.texto_literal.length <= TAMANHO_MAX_EXEMPLO);
  if (exibiveis.length === 0) return null;
  const trecho = exibiveis[sortearIndice(exibiveis.length, rng)]!;
  const candidato = CANDIDATOS.find((c) => c.id === trecho.candidato_id);
  return {
    trecho,
    nomeCandidato: candidato?.nome ?? trecho.candidato_id,
    avaliacoes: avaliacoes.filter((a) => a.trecho_id === trecho.id),
  };
}

/** Baixa o pool do demo (disjunto dos jogos por verificação de build). Falha devolve null. */
export async function carregarDados(): Promise<{ trechos: Trecho[]; avaliacoes: AvaliacaoViabilidade[] } | null> {
  try {
    const base = import.meta.env.BASE_URL;
    const trechos = await carregarJSON(base + 'data/trechos_demo.json', z.array(TrechoSchema));
    // As avaliações são opcionais: sem elas o demo mostra só o texto.
    const avaliacoes = await carregarJSON(base + 'data/avaliacoes_demo.json', z.array(AvaliacaoViabilidadeSchema)).catch(() => []);
    return { trechos, avaliacoes };
  } catch {
    return null;
  }
}

/** Baixa os dados públicos e sorteia um exemplo. Falha (rede/dado) devolve null: quem chama mostra o aviso offline. */
export async function carregarExemplo(rng: () => number = Math.random): Promise<ExemploSorteado | null> {
  const dados = await carregarDados();
  return dados ? escolherExemplo(dados.trechos, rng, dados.avaliacoes) : null;
}
