import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { montarDadosQuiz, SUBTEMAS, type EntradaQuiz } from '../../scripts/build-quiz-data';

const FRASE = 'A proposta cria um sistema nacional de regulação das filas em até dois anos.';
const plano = ['10', 'Linha um.', FRASE, 'Outra linha para dar contexto ao parágrafo seguinte.', ''].join('\n');
const ID = 'saude-filas-regulacao';

function entrada(sobre: Partial<EntradaQuiz> = {}): EntradaQuiz {
  return {
    novos: [
      {
        trechos: [{ subtema_id: ID, candidato_id: 'lula', arquivo: 'Lula_Plano_Original.md', query: FRASE }],
        enunciados: { [ID]: 'Qual proposta você prefere?' },
      },
    ],
    avaliacoes: ['C1', 'C2', 'C3', 'C4', 'C5'].map((c) => ({
      criterio_id: c,
      trecho_id: `lula-${ID}`,
      veredito: 'Parcial',
      justificativa: 'j',
      fonte: 'f',
      provisorio: true,
      revisar_dev: true,
      pendente_pesquisa: false,
    })),
    lerPlano: () => plano,
    apelidoDe: (cand) => (cand === 'lula' ? 'Candidato A' : 'Candidato ?'),
    ...sobre,
  };
}

describe('montarDadosQuiz', () => {
  it('gera o trecho com id candidato-subtema, linhas, página, hash e máscara', () => {
    const d = montarDadosQuiz(entrada());
    expect(d.trechos).toHaveLength(1);
    expect(d.trechos[0]).toMatchObject({
      id: `lula-${ID}`,
      candidato_id: 'lula',
      eixo: 'Saúde',
      subtema_id: ID,
      arquivo: 'Lula_Plano_Original.md',
      linha_inicio: 3,
      linha_fim: 3,
      pagina_pdf: 10,
      texto_literal: FRASE,
    });
    expect(d.trechos[0]!.hash_texto).toBe(createHash('sha256').update(FRASE).digest('hex'));
    expect(d.trechos[0]!.texto_mascarado).toBe(FRASE);
    expect(d.trechos[0]!.contexto_literal).toContain(FRASE);
  });

  it('gera o plano cego com o apelido do candidato e sem nenhuma referência ao autor', () => {
    const d = montarDadosQuiz(entrada());
    expect(d.planos[0]).toMatchObject({ id: `lula-${ID}`, apelido_neutro: 'Candidato A', eixo: 'Saúde', subtema_id: ID });
    expect(d.planos[0]!.texto_mascarado).toBe(FRASE);
    expect(Object.keys(d.planos[0]!)).not.toContain('candidato_id');
  });

  it('mascara o nome do candidato e do partido no texto e no contexto', () => {
    const frase = 'O governo da Missão fará isso, como propõe Renan, em até dois anos.';
    const d = montarDadosQuiz(
      entrada({ novos: [{ trechos: [{ subtema_id: ID, candidato_id: 'lula', arquivo: 'x.md', query: frase }], enunciados: { [ID]: 'P?' } }], lerPlano: () => `1\n${frase}\n` })
    );
    expect(d.planos[0]!.texto_mascarado).toBe('O governo da [***] fará isso, como propõe [***], em até dois anos.');
    expect(d.planos[0]!.contexto_mascarado).not.toMatch(/Missão|Renan/);
  });

  it('troca nome de programa por rótulo neutro e identificador direto por [***], sem mexer no literal nem no hash', () => {
    const frase = 'No nosso governo, ampliaremos o Programa Mais Médicos e o Novo PAC.';
    const d = montarDadosQuiz(
      entrada({ novos: [{ trechos: [{ subtema_id: ID, candidato_id: 'lula', arquivo: 'x.md', query: frase }], enunciados: { [ID]: 'P?' } }], lerPlano: () => `1\n${frase}\n` })
    );
    const esperado =
      'No [***], ampliaremos o [programa federal de atenção médica] e o [programa federal de investimentos em infraestrutura].';
    expect(d.trechos[0]!.texto_mascarado).toBe(esperado);
    expect(d.planos[0]!.texto_mascarado).toBe(esperado);
    expect(d.planos[0]!.contexto_mascarado).toBe(esperado);
    expect(d.trechos[0]!.texto_literal).toBe(frase);
    expect(d.trechos[0]!.hash_texto).toBe(createHash('sha256').update(frase).digest('hex'));
  });

  it('o subtema leva o assunto, o nome e o enunciado', () => {
    const d = montarDadosQuiz(entrada());
    expect(d.subtemas).toEqual([{ id: ID, eixo: 'Saúde', nome: 'Filas e regulação de especialistas', enunciado: 'Qual proposta você prefere?' }]);
  });

  it('as avaliações publicadas não levam campos internos', () => {
    const d = montarDadosQuiz(entrada());
    expect(Object.keys(d.avaliacoes[0]!).sort()).toEqual(['criterio_id', 'fonte', 'justificativa', 'trecho_id', 'veredito']);
    expect(d.avaliacoes).toHaveLength(5);
  });

  it('trecho sem avaliações não entra nos dados', () => {
    const d = montarDadosQuiz(entrada({ avaliacoes: [] }));
    expect(d.trechos).toEqual([]);
    expect(d.planos).toEqual([]);
    expect(d.subtemas).toEqual([]);
  });

  it('falha se o texto não existe no plano', () => {
    expect(() => montarDadosQuiz(entrada({ lerPlano: () => 'outro texto' }))).toThrow(/não achou/i);
  });

  it('falha se o subtema não está na tabela dos 15 aprovados', () => {
    const e = entrada();
    e.novos[0]!.trechos[0]!.subtema_id = 'saude-inventado';
    expect(() => montarDadosQuiz(e)).toThrow(/subtema/i);
  });

  it('a tabela tem os 15 subtemas aprovados, 3 por assunto', () => {
    expect(SUBTEMAS).toHaveLength(15);
    for (const eixo of ['Segurança', 'Economia', 'Educação', 'Reformas', 'Saúde']) {
      expect(SUBTEMAS.filter((s) => s.eixo === eixo)).toHaveLength(3);
    }
    expect(new Set(SUBTEMAS.map((s) => s.id)).size).toBe(15);
  });
});
