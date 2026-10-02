import { describe, it, expect } from 'vitest';
import { TOTAL_PERGUNTAS, concluidas, guardaDeRota, proximaEtapa, estadoDaTrilha, liberada, type SessaoJornada } from '../../src/core/jornada';

const dez = Object.fromEntries(Array.from({ length: TOTAL_PERGUNTAS }, (_, i) => [`q${i + 1}`, `t${i}`]));
const base: SessaoJornada = { ordemCandidatos: ['A', 'B'], respostasQuiz: {}, finalizado: false };

describe('jornada', () => {
  it('sem sessao so o teste cego esta liberado', () => {
    expect(liberada('teste-cego', null)).toBe(true);
    expect(liberada('revelacao', null)).toBe(false);
    expect(liberada('comparador', null)).toBe(false);
    expect(proximaEtapa(null)).toBe('teste-cego');
  });

  it('cada etapa libera a proxima, na ordem', () => {
    expect(concluidas(base, TOTAL_PERGUNTAS)['teste-cego']).toBe(true);
    expect(liberada('revelacao', base)).toBe(true);
    expect(liberada('quiz', base)).toBe(false);
    const vista = { ...base, revelacaoVista: true };
    expect(liberada('quiz', vista)).toBe(true);
    expect(liberada('resultado', vista)).toBe(false);
    const respondido = { ...vista, respostasQuiz: dez };
    expect(liberada('resultado', respondido)).toBe(true);
    expect(liberada('comparador', respondido)).toBe(false);
    const fim = { ...respondido, finalizado: true };
    expect(liberada('comparador', fim)).toBe(true);
    expect(proximaEtapa(fim)).toBe('resultado');
  });

  it('uma resposta a menos nao basta; o pulo conta como resposta', () => {
    const nove = Object.fromEntries(Object.entries(dez).slice(0, TOTAL_PERGUNTAS - 1));
    expect(concluidas({ ...base, revelacaoVista: true, respostasQuiz: nove })['quiz']).toBe(false);
    expect(concluidas({ ...base, revelacaoVista: true, respostasQuiz: { ...nove, [`q${TOTAL_PERGUNTAS}`]: 'pular' } })['quiz']).toBe(true);
  });

  it('o total é o tamanho das perguntas sorteadas guardadas na sessão', () => {
    const tres = { ...base, revelacaoVista: true, perguntasQuiz: [1, 2, 3], respostasQuiz: { a: '1', b: '2', c: 'pular' } };
    expect(TOTAL_PERGUNTAS).toBe(15);
    expect(concluidas(tres)['quiz']).toBe(true);
    expect(concluidas({ ...tres, respostasQuiz: { a: '1' } })['quiz']).toBe(false);
  });

  it('a guarda manda para a etapa que falta, com o motivo', () => {
    const g = guardaDeRota('comparador', base);
    expect(g.ok).toBe(false);
    if (!g.ok) {
      expect(g.destino).toBe('revelacao');
      expect(g.motivo).toMatch(/Comparador abre/);
    }
    expect(guardaDeRota('compartilhar', { ...base, revelacaoVista: true, respostasQuiz: dez }).ok).toBe(false);
    expect(guardaDeRota('metodo', null).ok).toBe(true);
    expect(guardaDeRota('parana', null).ok).toBe(true);
    expect(guardaDeRota('inicio', null).ok).toBe(true);
    expect(guardaDeRota('teste-cego', null).ok).toBe(true);
  });

  it('a trilha marca feito, atual, liberado e bloqueado', () => {
    const t = estadoDaTrilha({ ...base, revelacaoVista: false }, 'revelacao');
    expect(t.map((i) => i.estado)).toEqual(['feito', 'atual', 'bloqueado', 'bloqueado', 'bloqueado']);
    expect(t[4]?.motivo).toMatch(/Comparador/);
    const fim = estadoDaTrilha({ ...base, revelacaoVista: true, respostasQuiz: dez, finalizado: true }, 'comparador');
    expect(fim.map((i) => i.estado)).toEqual(['feito', 'feito', 'feito', 'feito', 'atual']);
  });
});
