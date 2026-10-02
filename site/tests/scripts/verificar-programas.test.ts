import { describe, it, expect } from 'vitest';
import { validarProgramas, type DadosProgramas } from '../../scripts/verificar-programas';

const limpo = (): DadosProgramas => ({
  trechos: [
    {
      id: 't1',
      texto_mascarado: 'Lançamos o [programa federal de livros digitais] e o [***] chegou.',
      contexto_mascarado: 'O contexto fala do [programa federal de atenção médica] sem nome.',
    },
  ],
  planos: [{ id: 't1', texto_mascarado: 'Texto sem nada.', contexto_mascarado: 'Outro texto sem nada.' }],
  avaliacoes: [{ trecho_id: 't1', criterio_id: 'C1', justificativa: 'O trecho cita o Novo PAC como fonte.' }],
  fontesDoQuiz: ['export function criar() { return a.justificativa; }'],
});

const temErro = (erros: string[], codigo: string, id?: string) =>
  erros.some((e) => e.includes(codigo) && (id === undefined || e.includes(`[${id}]`)));

describe('verificar-programas', () => {
  it('dados limpos passam (a justificativa é mascarada em runtime, então o Novo PAC nela não é erro)', () => {
    expect(validarProgramas(limpo())).toEqual([]);
  });

  it('termo do dicionário no texto ou no contexto mascarado é erro', () => {
    const d = limpo();
    d.trechos[0]!.texto_mascarado = 'Vamos ampliar o Programa Mais Médicos.';
    expect(temErro(validarProgramas(d), 'TERMO_NA_MASCARA', 't1')).toBe(true);
    const d2 = limpo();
    d2.trechos[0]!.contexto_mascarado = 'Em Goiás, o modelo funcionou.';
    expect(temErro(validarProgramas(d2), 'TERMO_NA_MASCARA', 't1')).toBe(true);
  });

  it('identificador direto no plano cego é erro (cabeçalho, autorreferência)', () => {
    const d = limpo();
    d.planos[0]!.contexto_mascarado = 'fim LIVRO AMARELO - MISSÃO 2026 início';
    expect(temErro(validarProgramas(d), 'TERMO_NA_MASCARA', 't1')).toBe(true);
    const d2 = limpo();
    d2.planos[0]!.texto_mascarado = 'Em nosso governo faremos isso.';
    expect(temErro(validarProgramas(d2), 'TERMO_NA_MASCARA', 't1')).toBe(true);
  });

  it('o verso do quiz nao pode ler a fonte da avaliação (arquivo do plano revela o autor)', () => {
    const d = limpo();
    d.fontesDoQuiz = ['el("p", { texto: a.fonte })'];
    expect(temErro(validarProgramas(d), 'FONTE_NO_QUIZ')).toBe(true);
  });
});
