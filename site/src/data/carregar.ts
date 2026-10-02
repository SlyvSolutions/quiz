import { z } from 'zod';
import { BaseCandidatosPRSchema, type BaseCandidatosPR } from './tipos';

export class ErroCargaDados extends Error {
  constructor(public mensagem: string, public arquivo: string, public detalhes?: any) {
    super(`Erro ao carregar ${arquivo}: ${mensagem}`);
    this.name = 'ErroCargaDados';
  }
}

export async function carregarJSON<T>(url: string, schema: z.ZodType<T>): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url);
  } catch (e) {
    throw new ErroCargaDados('Falha de rede (verifique sua conexão)', url);
  }

  if (!response.ok) {
    throw new ErroCargaDados(`HTTP ${response.status} ${response.statusText}`, url, { status: response.status });
  }

  let dados: unknown;
  try {
    dados = await response.json();
  } catch (e) {
    throw new ErroCargaDados('JSON inválido (falha no parse)', url);
  }

  const validacao = schema.safeParse(dados);
  
  if (!validacao.success) {
    // Recusa JSON fora da forma e devolve erro tipado, sem dados parciais
    throw new ErroCargaDados('Formato de dados inválido (fora do schema)', url, validacao.error.format());
  }

  return validacao.data;
}

export async function carregarCandidatosPR(): Promise<BaseCandidatosPR> {
  const base = import.meta.env.BASE_URL;
  return carregarJSON(base + 'data/candidatos_pr.json', BaseCandidatosPRSchema);
}
