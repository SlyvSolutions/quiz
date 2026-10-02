/**
 * Jornada do eleitor: Teste cego, Revelação, Quiz e Resultado, nessa ordem (F-02 a F-05 dependem uma da outra).
 * O Comparador mostra nome e texto de cada candidato; por isso só abre no fim, para não estragar o teste cego.
 * Regras puras: recebem a sessão e dizem o que está feito, o que está liberado e para onde mandar quem tenta pular.
 */

/** Total de perguntas quando a sessão ainda não guardou as sorteadas: todos os 15 subtemas entram em toda sessão. */
export const TOTAL_PERGUNTAS = 15;

export interface SessaoJornada {
  ordemCandidatos: string[];
  respostasQuiz: Record<string, string>;
  finalizado: boolean;
  revelacaoVista?: boolean;
  /** perguntas sorteadas: o total real do quiz é o tamanho desta lista */
  perguntasQuiz?: readonly unknown[];
}

export type IdEtapa = 'teste-cego' | 'revelacao' | 'quiz' | 'resultado' | 'comparador';

export const ETAPAS: { id: IdEtapa; rotulo: string }[] = [
  { id: 'teste-cego', rotulo: 'Teste cego' },
  { id: 'revelacao', rotulo: 'Revelação' },
  { id: 'quiz', rotulo: 'Quiz' },
  { id: 'resultado', rotulo: 'Resultado' },
  { id: 'comparador', rotulo: 'Comparador' },
];

export type EstadoEtapa = 'feito' | 'atual' | 'liberado' | 'bloqueado';

export interface ItemDaTrilha {
  id: IdEtapa;
  rotulo: string;
  numero: number;
  estado: EstadoEtapa;
  href: string;
  motivo: string | null;
}

const MOTIVOS: Record<Exclude<IdEtapa, 'teste-cego'>, string> = {
  revelacao: 'Escolha a ordem dos planos no teste cego para ver a revelação.',
  quiz: 'Veja a revelação antes de começar o quiz.',
  resultado: 'Responda todas as perguntas do quiz para ver o resultado.',
  comparador:
    'O Comparador abre quando você completa o teste. Assim os nomes só aparecem depois de você decidir.',
};

export function concluidas(s: SessaoJornada | null, total?: number): Record<IdEtapa, boolean> {
  const meta = total ?? s?.perguntasQuiz?.length ?? TOTAL_PERGUNTAS;
  const teste = !!s && s.ordemCandidatos.length > 0;
  const revelacao = teste && !!s?.revelacaoVista;
  const quiz = revelacao && Object.keys(s?.respostasQuiz ?? {}).length >= meta;
  const resultado = quiz && !!s?.finalizado;
  return { 'teste-cego': teste, revelacao, quiz, resultado, comparador: resultado };
}

/** Uma etapa está liberada quando a anterior foi concluída. O teste cego está sempre liberado. */
export function liberada(id: IdEtapa, s: SessaoJornada | null, total?: number): boolean {
  const c = concluidas(s, total);
  switch (id) {
    case 'teste-cego':
      return true;
    case 'revelacao':
      return c['teste-cego'];
    case 'quiz':
      return c.revelacao;
    case 'resultado':
      return c.quiz;
    case 'comparador':
      return c.resultado;
  }
}

/** A primeira etapa que falta; com tudo feito, o resultado. */
export function proximaEtapa(s: SessaoJornada | null, total?: number): IdEtapa {
  const c = concluidas(s, total);
  return (['teste-cego', 'revelacao', 'quiz', 'resultado'] as const).find((id) => !c[id]) ?? 'resultado';
}

export type Guarda = { ok: true } | { ok: false; destino: IdEtapa; motivo: string };

/** Barra quem tenta abrir uma etapa por endereço direto antes da hora e diz para onde levar. */
export function guardaDeRota(rota: string, s: SessaoJornada | null, total?: number): Guarda {
  // O cartão de compartilhar depende do resultado
  const etapa: IdEtapa | null = rota === 'compartilhar' ? 'resultado' : ETAPAS.some((e) => e.id === rota) ? (rota as IdEtapa) : null;
  if (!etapa) return { ok: true };
  // O cartão de compartilhar exige o resultado já visto; as demais etapas, só estarem liberadas
  const passa = rota === 'compartilhar' ? concluidas(s, total).resultado : liberada(etapa, s, total);
  if (passa) return { ok: true };
  const destino = proximaEtapa(s, total);
  return { ok: false, destino, motivo: MOTIVOS[etapa as Exclude<IdEtapa, 'teste-cego'>] };
}

export function estadoDaTrilha(s: SessaoJornada | null, rotaAtual: string, total?: number): ItemDaTrilha[] {
  const c = concluidas(s, total);
  return ETAPAS.map((e, i) => {
    let estado: EstadoEtapa;
    if (rotaAtual === e.id || (rotaAtual === 'compartilhar' && e.id === 'resultado')) estado = 'atual';
    else if (e.id !== 'comparador' && c[e.id]) estado = 'feito';
    else if (liberada(e.id, s, total)) estado = 'liberado';
    else estado = 'bloqueado';
    return {
      id: e.id,
      rotulo: e.rotulo,
      numero: i + 1,
      estado,
      href: `#${e.id}`,
      motivo: estado === 'bloqueado' ? MOTIVOS[e.id as Exclude<IdEtapa, 'teste-cego'>] : null,
    };
  });
}
