// @vitest-environment jsdom
import { TOTAL_PERGUNTAS } from '../../src/core/jornada';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/app/router', () => ({ navigate: vi.fn() }));
import { salvarSessao } from '../../src/state/sessao-storage';
import { renderCompartilhar } from '../../src/screens/resultado/compartilhar';

const candidatos = [
  { id: 'lula', nome: 'Lula', partido: 'PT' },
  { id: 'flavio', nome: 'Flávio Bolsonaro', partido: 'PL' },
  { id: 'renan', nome: 'Renan Santos', partido: 'Missão' },
  { id: 'caiado', nome: 'Ronaldo Caiado', partido: 'PSD' },
  { id: 'cury', nome: 'Augusto Cury', partido: 'Sem Partido' },
];
const trechosOriginais = [{ id: 'lula-seguranca', candidato_id: 'lula' }];
const trechosQuiz = [
  { id: 'flavio-s1', candidato_id: 'flavio' },
  { id: 'lula-s2', candidato_id: 'lula' },
];

beforeEach(() => {
  localStorage.clear();
  document.body.replaceChildren();
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      if (url.endsWith('/trechos.json')) return { ok: true, json: async () => trechosOriginais };
      if (url.endsWith('/candidatos.json')) return { ok: true, json: async () => candidatos };
      if (url.endsWith('/trechos_quiz.json')) return { ok: true, json: async () => trechosQuiz };
      return { ok: false, json: async () => ({}) };
    })
  );
});

describe('Compartilhar', () => {
  it('conta os votos do quiz por subtemas, que estão em trechos_quiz.json', async () => {
    salvarSessao({
      ordemCandidatos: [],
      respostasQuiz: { s1: 'flavio-s1', s2: 'lula-s2', s3: 'pular' },
      finalizado: true,
    });
    const tela = await renderCompartilhar();
    const linhas = [...tela.querySelectorAll('.comp-cand-row')].map((l) => l.textContent);
    expect(linhas[0]).toContain('50%');
    expect(linhas[1]).toContain('50%');
    expect(linhas.join(' ')).toContain('Lula');
    expect(linhas.join(' ')).toContain('Flávio Bolsonaro');
  });

  it('a imagem leva o mesmo aviso do texto: o total de perguntas e não é recomendação de voto', async () => {
    salvarSessao({ ordemCandidatos: [], respostasQuiz: { s1: 'lula-s2' }, finalizado: true });
    const tela = await renderCompartilhar();
    const area = tela.querySelector('.comp-print-area')!;
    expect(area.textContent).toContain(`Minha concordância com ${TOTAL_PERGUNTAS} trechos`);
    expect(area.textContent).toContain('Não é recomendação de voto');
    expect(area.textContent).not.toContain('Meu Teste Cego dos Planos de Governo');
  });
});
