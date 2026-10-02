export type Rng = () => number;

export const EIXOS_ORDEM = ['Segurança', 'Economia', 'Educação', 'Reformas', 'Saúde'] as const;
export const MIN_OPCOES = 3;
const MAX_OPCOES = 5;

/** Diferença máxima de aparições entre candidatos que o sorteio aceita (0 = igualdade exata). */
export const DIFERENCA_MAXIMA = 0;

export interface SubtemaQuiz {
  id: string;
  eixo: string;
  nome: string;
  enunciado: string;
}

export interface TrechoQuizRef {
  id: string;
  subtema_id: string;
  candidato_id: string;
}

export interface PerguntaSorteada {
  id: string;
  eixo: string;
  subtema_id: string;
  enunciado: string;
  /** ids de trechos, um por candidato (3 a 5) */
  opcoes: string[];
}

export interface OpcoesSorteio {
  rng?: Rng;
}

/** Fisher-Yates com rng injetável, para o sorteio ser testável. */
export function embaralhar<T>(lista: readonly T[], rng: Rng): T[] {
  const a = [...lista];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/**
 * Escolhe, para cada pergunta, quais candidatos aparecem de modo que TODOS os candidatos apareçam o
 * mesmo número de vezes na sessão, com MIN_OPCOES a MAX_OPCOES opções por pergunta. Só conta quantas
 * vezes cada um aparece: nunca olha o conteúdo, o veredito nem a concretude de nenhum trecho.
 *
 * Método: fluxo máximo (candidato -> pergunta, no máximo 1 por par). Primeiro enche cada pergunta até
 * o mínimo de opções, depois completa até cada candidato ter k aparições; k é o maior valor que fecha.
 * A ordem de tentativa é embaralhada com o rng, então quem sai de cada pergunta é sorteado.
 *
 * Se nenhum k fechar (ex.: um candidato com menos aparições possíveis que o mínimo exige), devolve
 * todas as opções disponíveis: a igualdade não é possível e o limite é dos dados, não do sorteio.
 */
export function equilibrarOpcoes(
  disponiveis: readonly (readonly string[])[],
  candidatos: readonly string[],
  rng: Rng
): string[][] {
  const Q = disponiveis.length;
  const C = candidatos.length;
  const completo = () => disponiveis.map((d) => [...d]);
  if (Q === 0 || C === 0) return completo();

  const aparicoes = candidatos.map((c) => disponiveis.filter((d) => d.includes(c)).length);
  const teto = Math.min(...aparicoes);

  const tentar = (k: number): string[][] | null => {
    const S = 0;
    const T = C + Q + 1;
    const cap: number[][] = Array.from({ length: T + 1 }, () => new Array<number>(T + 1).fill(0));
    candidatos.forEach((c, i) => {
      cap[S]![1 + i] = k;
      disponiveis.forEach((d, q) => {
        if (d.includes(c)) cap[1 + i]![1 + C + q] = 1;
      });
    });
    const ordem = embaralhar(Array.from({ length: T + 1 }, (_, i) => i), rng);
    const aumentar = (): boolean => {
      const visto = new Array<boolean>(T + 1).fill(false);
      const dfs = (u: number): boolean => {
        if (u === T) return true;
        visto[u] = true;
        for (const v of ordem) {
          if (!visto[v] && cap[u]![v]! > 0 && dfs(v)) {
            cap[u]![v]!--;
            cap[v]![u]!++;
            return true;
          }
        }
        return false;
      };
      return dfs(S);
    };
    const completar = (): number => {
      let n = 0;
      while (aumentar()) n++;
      return n;
    };
    // Fase 1: toda pergunta chega ao mínimo. Fase 2: o resto, até cada candidato ter k aparições.
    for (let q = 0; q < Q; q++) cap[1 + C + q]![T] = MIN_OPCOES;
    let fluxo = completar();
    if (fluxo !== MIN_OPCOES * Q) return null;
    for (let q = 0; q < Q; q++) cap[1 + C + q]![T] = MAX_OPCOES - MIN_OPCOES;
    fluxo += completar();
    if (fluxo !== C * k) return null;
    return disponiveis.map((_, q) => candidatos.filter((_c, i) => cap[1 + C + q]![1 + i]! > 0));
  };

  for (let k = teto; k >= 1; k--) {
    if (C * k < MIN_OPCOES * Q || C * k > MAX_OPCOES * Q) continue;
    const r = tentar(k);
    if (r) return r;
  }
  return completo();
}

/**
 * Monta o quiz com TODOS os subtemas elegíveis (3 por assunto nos dados atuais) e só embaralha: a ordem dos
 * assuntos e a dos subtemas dentro de cada assunto. As perguntas saem intercaladas: nunca duas do mesmo
 * assunto em sequência quando isso é possível. Um subtema só entra se tiver trechos de pelo menos 3 candidatos.
 */
export function sortearPerguntas(
  subtemas: SubtemaQuiz[],
  trechos: TrechoQuizRef[],
  opcoes: OpcoesSorteio = {}
): PerguntaSorteada[] {
  const rng = opcoes.rng ?? Math.random;

  const trechosDe = new Map<string, TrechoQuizRef[]>();
  for (const t of trechos) {
    const lista = trechosDe.get(t.subtema_id) ?? [];
    lista.push(t);
    trechosDe.set(t.subtema_id, lista);
  }
  const candidatosDe = (id: string) => new Set((trechosDe.get(id) ?? []).map((t) => t.candidato_id));
  const elegivel = (s: SubtemaQuiz) => candidatosDe(s.id).size >= MIN_OPCOES;

  const escolhidos = new Map<string, SubtemaQuiz[]>();
  for (const eixo of EIXOS_ORDEM) {
    escolhidos.set(eixo, embaralhar(subtemas.filter((s) => s.eixo === eixo && elegivel(s)), rng));
  }
  const porEixo = Math.max(0, ...EIXOS_ORDEM.map((e) => escolhidos.get(e)!.length));

  const rodadas: string[][] = [];
  for (let r = 0; r < porEixo; r++) {
    rodadas.push(embaralhar(EIXOS_ORDEM.filter((e) => (escolhidos.get(e)?.length ?? 0) > r), rng));
  }
  // Evita o mesmo assunto colado entre o fim de uma rodada e o começo da seguinte
  for (let r = 1; r < rodadas.length; r++) {
    const anterior = rodadas[r - 1]!;
    const atual = rodadas[r]!;
    if (atual.length > 1 && anterior[anterior.length - 1] === atual[0]) {
      [atual[0], atual[1]] = [atual[1]!, atual[0]!];
    }
  }

  const base: { subtema: SubtemaQuiz; eixo: string; porCandidato: Map<string, TrechoQuizRef> }[] = [];
  rodadas.forEach((eixos, r) => {
    for (const eixo of eixos) {
      const subtema = escolhidos.get(eixo)![r]!;
      const porCandidato = new Map<string, TrechoQuizRef>();
      for (const t of embaralhar(trechosDe.get(subtema.id)!, rng)) {
        if (!porCandidato.has(t.candidato_id)) porCandidato.set(t.candidato_id, t);
      }
      base.push({ subtema, eixo, porCandidato });
    }
  });

  // Todos os candidatos que podem aparecer em algum subtema elegível entram na conta de igualdade
  const todos = new Set<string>();
  for (const s of subtemas) if (elegivel(s)) candidatosDe(s.id).forEach((c) => todos.add(c));
  const escolhas = equilibrarOpcoes(
    base.map((b) => [...b.porCandidato.keys()]),
    [...todos].sort(),
    rng
  );

  return base.map((b, i) => ({
    id: b.subtema.id,
    eixo: b.eixo,
    subtema_id: b.subtema.id,
    enunciado: b.subtema.enunciado,
    opcoes: embaralhar(escolhas[i]!, rng).map((c) => b.porCandidato.get(c)!.id),
  }));
}

/**
 * Diz se as perguntas guardadas na sessão ainda valem para os dados atuais: o conjunto de subtemas
 * é exatamente o dos subtemas elegíveis (3 ou mais candidatos), sem repetição, e cada pergunta tem de
 * 3 a 5 opções que existem em trechos_quiz.json, são do próprio subtema e de candidatos diferentes.
 * Um quiz válido em andamento passa; sessão de outra versão (outro total de perguntas, subtema removido) não.
 */
export function perguntasCompativeis(
  guardadas: readonly PerguntaSorteada[] | undefined,
  subtemas: readonly SubtemaQuiz[],
  trechos: readonly TrechoQuizRef[]
): boolean {
  if (!Array.isArray(guardadas) || guardadas.length === 0) return false;
  const trechoPorId = new Map(trechos.map((t) => [t.id, t]));
  const candidatosDe = new Map<string, Set<string>>();
  for (const t of trechos) {
    const c = candidatosDe.get(t.subtema_id) ?? new Set<string>();
    c.add(t.candidato_id);
    candidatosDe.set(t.subtema_id, c);
  }
  const elegiveis = subtemas.filter((s) => (candidatosDe.get(s.id)?.size ?? 0) >= MIN_OPCOES);
  if (guardadas.length !== elegiveis.length) return false;
  const eixoPorId = new Map(elegiveis.map((s) => [s.id, s.eixo]));
  const vistos = new Set<string>();
  for (const p of guardadas) {
    if (!p || typeof p.subtema_id !== 'string' || !Array.isArray(p.opcoes)) return false;
    if (!eixoPorId.has(p.subtema_id) || vistos.has(p.subtema_id) || eixoPorId.get(p.subtema_id) !== p.eixo) return false;
    vistos.add(p.subtema_id);
    if (p.opcoes.length < MIN_OPCOES || p.opcoes.length > MAX_OPCOES) return false;
    const cands = new Set<string>();
    for (const o of p.opcoes) {
      const t = trechoPorId.get(o);
      if (!t || t.subtema_id !== p.subtema_id) return false;
      cands.add(t.candidato_id);
    }
    if (cands.size !== p.opcoes.length) return false;
  }
  return true;
}
