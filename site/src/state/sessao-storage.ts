import type { PerguntaSorteada } from '../core/sorteio-quiz';

export interface SessaoState {
  versao: 1;
  ordemCandidatos: string[];
  respostasQuiz: Record<string, string>;
  finalizado: boolean;
  /** A tela de revelação já foi vista: libera o quiz */
  revelacaoVista?: boolean;
  /** Perguntas sorteadas para esta sessão: guardadas para o recarregamento não mudar o quiz */
  perguntasQuiz?: PerguntaSorteada[];
  /** Ordem inicial (sorteada) dos planos no Teste cego, guardada para o F5 não trocar os cards. Não é a ordem da pessoa. */
  ordemInicialCego?: string[];
}

const STORAGE_KEY = 'mq.sessao.v1';

function isStorageAvailable(): boolean {
  try {
    const test = '__test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}

let memoryFallback: SessaoState | null = null;
const canUseStorage = isStorageAvailable();

export function lerSessao(): SessaoState | null {
  if (!canUseStorage) {
    return memoryFallback;
  }
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    if (data.versao === 1) return data;
  } catch (e) {
    // Ignora erro de parse
  }
  return null;
}

export function salvarSessao(state: Omit<SessaoState, 'versao'>) {
  const fullState: SessaoState = { ...state, versao: 1 };
  if (!canUseStorage) {
    memoryFallback = fullState;
    console.warn("Armazenamento local bloqueado. Recarregar a página reiniciará o teste.");
    return false;
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fullState));
    return true;
  } catch (e) {
    return false;
  }
}

/** Recomeça a jornada: apaga a sessão (ordem, perguntas e respostas); o próximo quiz faz novo sorteio. */
export function reiniciarJornada() {
  memoryFallback = null;
  if (canUseStorage) {
    localStorage.removeItem(STORAGE_KEY);
  }
}

/**
 * Sessão depois do "Pronto" no Teste cego. Mudou a ordem ou o quiz já foi concluído (chegou ao Resultado):
 * é uma jornada nova, então as perguntas e respostas do quiz são descartadas e o próximo quiz faz novo sorteio.
 * Quiz no meio e mesma ordem: nada muda (recarregar a página não troca as perguntas).
 */
export function aplicarOrdemTesteCego(atual: SessaoState | null, ordem: string[]): Omit<SessaoState, 'versao'> {
  const base = atual ?? { versao: 1 as const, ordemCandidatos: [], respostasQuiz: {}, finalizado: false };
  const mudou = JSON.stringify(base.ordemCandidatos) !== JSON.stringify(ordem);
  const { versao: _versao, ...resto } = base;
  void _versao;
  if (!mudou && !base.finalizado) return { ...resto, ordemCandidatos: ordem };
  const { perguntasQuiz: _perguntas, ...semPerguntas } = resto;
  void _perguntas;
  return {
    ...semPerguntas,
    ordemCandidatos: ordem,
    respostasQuiz: {},
    finalizado: false,
    revelacaoVista: mudou ? false : base.revelacaoVista,
  };
}
