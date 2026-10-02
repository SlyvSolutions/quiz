import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  sortearPerguntas,
  perguntasCompativeis,
  EIXOS_ORDEM,
  type SubtemaQuiz,
  type TrechoQuizRef,
} from '../../src/core/sorteio-quiz';

function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function fixture(subPorEixo = 3, cands = ['lula', 'flavio', 'caiado', 'renan']) {
  const subtemas: SubtemaQuiz[] = [];
  const trechos: TrechoQuizRef[] = [];
  for (const eixo of EIXOS_ORDEM) {
    for (let i = 1; i <= subPorEixo; i++) {
      const id = `${eixo.toLowerCase()}-${i}`;
      subtemas.push({ id, eixo, nome: `${eixo} ${i}`, enunciado: `Pergunta ${id}?` });
      for (const c of cands) trechos.push({ id: `${c}-${id}`, subtema_id: id, candidato_id: c });
    }
  }
  return { subtemas, trechos };
}

describe('sortearPerguntas', () => {
  it('gera 15 perguntas: todos os 15 subtemas, 3 por assunto', () => {
    const { subtemas, trechos } = fixture();
    const p = sortearPerguntas(subtemas, trechos, { rng: mulberry32(1) });
    expect(p).toHaveLength(15);
    expect(new Set(p.map((x) => x.subtema_id))).toEqual(new Set(subtemas.map((x) => x.id)));
    for (const eixo of EIXOS_ORDEM) {
      const doEixo = p.filter((x) => x.eixo === eixo);
      expect(doEixo).toHaveLength(3);
      expect(new Set(doEixo.map((x) => x.subtema_id)).size).toBe(3);
    }
  });

  it('só embaralha: a ordem dos assuntos e dos subtemas varia entre sessões', () => {
    const { subtemas, trechos } = fixture();
    const ordens = new Set<string>();
    for (let s = 0; s < 30; s++) ordens.add(sortearPerguntas(subtemas, trechos, { rng: mulberry32(s) }).map((q) => q.subtema_id).join());
    expect(ordens.size).toBeGreaterThan(20);
  });

  it('nunca coloca duas perguntas do mesmo assunto em sequência (200 sorteios)', () => {
    const { subtemas, trechos } = fixture();
    for (let s = 0; s < 200; s++) {
      const p = sortearPerguntas(subtemas, trechos, { rng: mulberry32(s) });
      for (let i = 1; i < p.length; i++) expect(p[i]!.eixo).not.toBe(p[i - 1]!.eixo);
    }
  });

  it('cada pergunta tem de 3 a 5 opções, de candidatos distintos e do próprio subtema', () => {
    const { subtemas, trechos } = fixture(3, ['lula', 'flavio', 'caiado', 'renan', 'cury']);
    const p = sortearPerguntas(subtemas, trechos, { rng: mulberry32(7) });
    for (const q of p) {
      expect(q.opcoes.length).toBeGreaterThanOrEqual(3);
      expect(q.opcoes.length).toBeLessThanOrEqual(5);
      const doSub = new Set(trechos.filter((t) => t.subtema_id === q.subtema_id).map((t) => t.id));
      expect(q.opcoes.every((o) => doSub.has(o))).toBe(true);
      const cands = q.opcoes.map((o) => trechos.find((t) => t.id === o)!.candidato_id);
      expect(new Set(cands).size).toBe(cands.length);
    }
  });

  it('ignora subtema com menos de 3 candidatos', () => {
    const { subtemas, trechos } = fixture(3);
    const fraco = 'saúde-1';
    const filtrados = trechos.filter((t) => !(t.subtema_id === fraco && t.candidato_id !== 'lula'));
    for (let s = 0; s < 50; s++) {
      const p = sortearPerguntas(subtemas, filtrados, { rng: mulberry32(s) });
      expect(p.some((q) => q.subtema_id === fraco)).toBe(false);
    }
  });

  it('assunto com menos subtemas elegíveis devolve menos perguntas, sem quebrar', () => {
    const { subtemas, trechos } = fixture(1);
    const p = sortearPerguntas(subtemas, trechos, { rng: mulberry32(2) });
    expect(p).toHaveLength(5);
    expect(sortearPerguntas([], [], { rng: mulberry32(2) })).toEqual([]);
  });

  it('é determinístico com o mesmo rng e varia com rngs diferentes', () => {
    const { subtemas, trechos } = fixture();
    const a = sortearPerguntas(subtemas, trechos, { rng: mulberry32(11) });
    const b = sortearPerguntas(subtemas, trechos, { rng: mulberry32(11) });
    const c = sortearPerguntas(subtemas, trechos, { rng: mulberry32(12) });
    expect(a).toEqual(b);
    expect(JSON.stringify(a)).not.toBe(JSON.stringify(c));
  });

  it('com muitos sorteios todos os subtemas e todos os candidatos aparecem', () => {
    const { subtemas, trechos } = fixture(3, ['lula', 'flavio', 'caiado', 'renan', 'cury']);
    const subs = new Set<string>();
    const cands = new Set<string>();
    for (let s = 0; s < 300; s++) {
      for (const q of sortearPerguntas(subtemas, trechos, { rng: mulberry32(s) })) {
        subs.add(q.subtema_id);
        q.opcoes.forEach((o) => cands.add(trechos.find((t) => t.id === o)!.candidato_id));
      }
    }
    expect(subs.size).toBe(15);
    expect(cands.size).toBe(5);
  });
});

function contar(p: ReturnType<typeof sortearPerguntas>, trechos: TrechoQuizRef[]) {
  const porId = new Map(trechos.map((t) => [t.id, t.candidato_id]));
  const cont: Record<string, number> = {};
  for (const q of p) for (const o of q.opcoes) cont[porId.get(o)!] = (cont[porId.get(o)!] ?? 0) + 1;
  return cont;
}

describe('equilíbrio de aparições por candidato', () => {
  const dir = new URL('../../public/data/', import.meta.url);
  const subtemas = JSON.parse(readFileSync(new URL('subtemas.json', dir), 'utf8')) as SubtemaQuiz[];
  const trechos = JSON.parse(readFileSync(new URL('trechos_quiz.json', dir), 'utf8')) as TrechoQuizRef[];

  it('nos dados reais, os 5 candidatos aparecem 12 vezes cada (teto de Renan e Cury) em 500 sorteios', () => {
    for (let s = 0; s < 500; s++) {
      const p = sortearPerguntas(subtemas, trechos, { rng: mulberry32(s) });
      expect(p).toHaveLength(15);
      const cont = contar(p, trechos);
      const valores = ['lula', 'flavio', 'caiado', 'renan', 'cury'].map((c) => cont[c] ?? 0);
      expect(valores).toEqual([12, 12, 12, 12, 12]);
    }
  });

  it('nos dados reais, o trecho que fica de fora varia: cada candidato é cortado em sessões diferentes', () => {
    const fora = new Map<string, Set<string>>();
    for (let s = 0; s < 200; s++) {
      const usados = new Set(sortearPerguntas(subtemas, trechos, { rng: mulberry32(s) }).flatMap((q) => q.opcoes));
      for (const t of trechos) if (!usados.has(t.id)) (fora.get(t.candidato_id) ?? fora.set(t.candidato_id, new Set()).get(t.candidato_id)!).add(t.id);
    }
    // Lula (13), Flávio (15) e Caiado (15) têm trecho de sobra; cada um sai por mais de um trecho
    for (const c of ['lula', 'flavio', 'caiado']) expect(fora.get(c)!.size).toBeGreaterThan(1);
  });

  it('nos dados reais mantém 3 por assunto, intercalação, escape de 3 a 5 opções', () => {
    for (let s = 0; s < 500; s++) {
      const p = sortearPerguntas(subtemas, trechos, { rng: mulberry32(s) });
      for (const eixo of EIXOS_ORDEM) expect(p.filter((q) => q.eixo === eixo)).toHaveLength(3);
      for (let i = 1; i < p.length; i++) expect(p[i]!.eixo).not.toBe(p[i - 1]!.eixo);
      for (const q of p) {
        expect(q.opcoes.length).toBeGreaterThanOrEqual(3);
        expect(q.opcoes.length).toBeLessThanOrEqual(5);
      }
    }
  });

  it('o equilíbrio vale também com 25 perguntas (5 por assunto)', () => {
    const f = fixture(5, ['a', 'b', 'c', 'd', 'e']);
    // candidato 'e' ausente de um subtema de cada assunto
    const ts = f.trechos.filter((t) => !(t.candidato_id === 'e' && /-[12]$/.test(t.subtema_id)));
    for (let s = 0; s < 100; s++) {
      const p = sortearPerguntas(f.subtemas, ts, { rng: mulberry32(s) });
      expect(p).toHaveLength(25);
      expect(new Set(Object.values(contar(p, ts))).size).toBe(1);
    }
  });

  it('a escolha de quem sai de cada pergunta é aleatória (varia com o rng), sem olhar o conteúdo', () => {
    const a = sortearPerguntas(subtemas, trechos, { rng: mulberry32(1) });
    const b = sortearPerguntas(subtemas, trechos, { rng: mulberry32(2) });
    expect(JSON.stringify(a)).not.toBe(JSON.stringify(b));
    // quem é cortado de alguma pergunta que o tinha disponível, em algum sorteio
    const cortados = new Set<string>();
    for (let s = 0; s < 200; s++) {
      for (const q of sortearPerguntas(subtemas, trechos, { rng: mulberry32(s) })) {
        const disp = trechos.filter((t) => t.subtema_id === q.subtema_id);
        if (q.opcoes.length < disp.length) {
          const ficaram = new Set(q.opcoes);
          disp.filter((t) => !ficaram.has(t.id)).forEach((t) => cortados.add(t.candidato_id));
        }
      }
    }
    // Renan e Cury (12 trechos) são o teto: todos os trechos deles entram; quem é cortado é Lula, Flávio e Caiado
    expect([...cortados].sort()).toEqual(['caiado', 'flavio', 'lula']);
  });

  it('se a igualdade for impossível (candidato com 1 só trecho nas perguntas), usa todas as opções disponíveis', () => {
    const f = fixture(2, ['a', 'b', 'c', 'd']);
    const ts = [...f.trechos, { id: 'z-saúde-1', subtema_id: 'saúde-1', candidato_id: 'z' }];
    const p = sortearPerguntas(f.subtemas, ts, { rng: mulberry32(4) });
    expect(p).toHaveLength(10);
    for (const q of p) {
      expect(q.opcoes.length).toBe(ts.filter((t) => t.subtema_id === q.subtema_id).length);
    }
  });
});

describe('perguntasCompativeis (sessão guardada x dados atuais)', () => {
  const dados = () => fixture();
  const sorteio = () => {
    const { subtemas, trechos } = dados();
    return { subtemas, trechos, guardadas: sortearPerguntas(subtemas, trechos, { rng: mulberry32(7) }) };
  };

  it('quiz válido em andamento (F5 no meio) é compatível', () => {
    const { subtemas, trechos, guardadas } = sorteio();
    expect(perguntasCompativeis(guardadas, subtemas, trechos)).toBe(true);
  });

  it('sessão antiga de 10 perguntas (2 subtemas por assunto) é incompatível', () => {
    const { subtemas, trechos, guardadas } = sorteio();
    const dez = EIXOS_ORDEM.flatMap((e) => guardadas.filter((p) => p.eixo === e).slice(0, 2));
    expect(dez).toHaveLength(10);
    expect(perguntasCompativeis(dez, subtemas, trechos)).toBe(false);
  });

  it('subtema que não existe mais, ou trecho inexistente, é incompatível', () => {
    const { subtemas, trechos, guardadas } = sorteio();
    const semSubtema = guardadas.map((p, i) => (i === 0 ? { ...p, subtema_id: 'sumiu', id: 'sumiu' } : p));
    expect(perguntasCompativeis(semSubtema, subtemas, trechos)).toBe(false);
    const semTrecho = guardadas.map((p, i) => (i === 0 ? { ...p, opcoes: [...p.opcoes.slice(1), 'trecho-fantasma'] } : p));
    expect(perguntasCompativeis(semTrecho, subtemas, trechos)).toBe(false);
  });

  it('trecho que pertence a outro subtema, ou menos de 3 opções, é incompatível', () => {
    const { subtemas, trechos, guardadas } = sorteio();
    const outro = trechos.find((t) => t.subtema_id !== guardadas[0]!.subtema_id)!.id;
    expect(perguntasCompativeis(guardadas.map((p, i) => (i === 0 ? { ...p, opcoes: [outro, ...p.opcoes.slice(1)] } : p)), subtemas, trechos)).toBe(false);
    expect(perguntasCompativeis(guardadas.map((p, i) => (i === 0 ? { ...p, opcoes: p.opcoes.slice(0, 2) } : p)), subtemas, trechos)).toBe(false);
  });

  it('subtema novo elegível nos dados deixa a sessão guardada incompatível', () => {
    const { guardadas } = sorteio();
    const mais = fixture(4);
    expect(perguntasCompativeis(guardadas, mais.subtemas, mais.trechos)).toBe(false);
  });

  it('estrutura inválida (não é lista, vazia, item sem opcoes) é incompatível', () => {
    const { subtemas, trechos } = sorteio();
    expect(perguntasCompativeis(undefined, subtemas, trechos)).toBe(false);
    expect(perguntasCompativeis([], subtemas, trechos)).toBe(false);
    expect(perguntasCompativeis([{ id: 'x' }] as never, subtemas, trechos)).toBe(false);
  });
});
