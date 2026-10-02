import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { verificarQuiz, type DadosQuiz } from '../../scripts/verificar-quiz-subtemas';

const EIXOS = ['Segurança', 'Economia', 'Educação', 'Reformas', 'Saúde'];
const CANDS = ['lula', 'flavio', 'caiado'];
const APELIDOS: Record<string, string> = { lula: 'Candidato C', flavio: 'Candidato A', caiado: 'Candidato B' };
const sha = (t: string) => createHash('sha256').update(t).digest('hex');

function dadosValidos(): DadosQuiz {
  const subtemas = EIXOS.flatMap((eixo) =>
    [1, 2, 3].map((i) => ({ id: `${eixo}-${i}`, eixo, nome: `${eixo} ${i}`, enunciado: `Pergunta ${eixo} ${i}?` }))
  );
  const trechos = subtemas.flatMap((s) =>
    CANDS.map((c) => {
      const texto = `Proposta ${c} ${s.id} com instrumento definido e prazo para o ano.`;
      return {
        id: `${c}-${s.id}`,
        candidato_id: c,
        eixo: s.eixo,
        subtema_id: s.id,
        arquivo: `${c}.md`,
        linha_inicio: 1,
        linha_fim: 1,
        texto_literal: texto,
        texto_mascarado: texto,
        hash_texto: sha(texto),
      };
    })
  );
  const planos = trechos.map((t) => ({
    id: t.id,
    apelido_neutro: APELIDOS[t.candidato_id]!,
    eixo: t.eixo,
    subtema_id: t.subtema_id,
    texto_mascarado: t.texto_mascarado,
  }));
  const avaliacoes = trechos.flatMap((t) =>
    ['C1', 'C2', 'C3', 'C4', 'C5'].map((c) => ({
      trecho_id: t.id,
      criterio_id: c,
      veredito: 'Parcial',
      justificativa: 'O trecho descreve a medida e cita o dispositivo.',
      fonte: 'plano.md:1',
    }))
  );
  const plano = trechos.map((t) => t.texto_literal).join('\n');
  return {
    subtemas,
    trechos,
    planos,
    avaliacoes,
    criterios: {
      criterios: ['C1', 'C2', 'C3', 'C4', 'C5'].map((id) => ({ id })),
      escala: ['Viável', 'Viável com condições', 'Parcial', 'Difícil', 'Inviável nos termos propostos', 'Sem base para avaliar'],
    },
    apelidosPorCandidato: APELIDOS,
    lerPlano: () => plano,
  };
}

const temErro = (erros: string[], codigo: string, trecho?: string) =>
  erros.some((e) => e.includes(codigo) && (!trecho || e.includes(trecho)));

describe('verificarQuiz (quiz por subtemas)', () => {
  it('dados válidos não geram erro', () => {
    expect(verificarQuiz(dadosValidos())).toEqual([]);
  });

  it('assunto com menos de 3 subtemas elegíveis é erro', () => {
    const d = dadosValidos();
    d.trechos = d.trechos.filter((t) => !(t.eixo === 'Saúde' && t.subtema_id === 'Saúde-3'));
    d.planos = d.planos.filter((p) => d.trechos.some((t) => t.id === p.id));
    d.avaliacoes = d.avaliacoes.filter((a) => d.trechos.some((t) => t.id === a.trecho_id));
    expect(temErro(verificarQuiz(d), 'ASSUNTO_SEM_SUBTEMAS', 'Saúde')).toBe(true);
  });

  it('subtema com menos de 3 candidatos não conta como elegível', () => {
    const d = dadosValidos();
    d.trechos = d.trechos.filter((t) => !(t.subtema_id === 'Saúde-3' && t.candidato_id !== 'lula'));
    d.planos = d.planos.filter((p) => d.trechos.some((t) => t.id === p.id));
    d.avaliacoes = d.avaliacoes.filter((a) => d.trechos.some((t) => t.id === a.trecho_id));
    expect(temErro(verificarQuiz(d), 'ASSUNTO_SEM_SUBTEMAS', 'Saúde')).toBe(true);
  });

  it('trecho com subtema inexistente ou de outro assunto é erro', () => {
    const d = dadosValidos();
    d.trechos[0]!.subtema_id = 'nao-existe';
    expect(temErro(verificarQuiz(d), 'TRECHO_SEM_SUBTEMA', d.trechos[0]!.id)).toBe(true);
    const d2 = dadosValidos();
    d2.trechos[0]!.eixo = 'Saúde';
    expect(temErro(verificarQuiz(d2), 'TRECHO_SEM_SUBTEMA', d2.trechos[0]!.id)).toBe(true);
  });

  it('dois trechos do mesmo candidato no mesmo subtema é erro', () => {
    const d = dadosValidos();
    d.trechos.push({ ...d.trechos[0]!, id: 'repetido' });
    d.planos.push({ ...d.planos[0]!, id: 'repetido' });
    expect(temErro(verificarQuiz(d), 'TRECHO_REPETIDO')).toBe(true);
  });

  it('trecho com 4 avaliações é erro', () => {
    const d = dadosValidos();
    d.avaliacoes = d.avaliacoes.filter((a) => !(a.trecho_id === 'lula-Saúde-1' && a.criterio_id === 'C5'));
    expect(temErro(verificarQuiz(d), 'AVALIACOES', 'lula-Saúde-1')).toBe(true);
  });

  it('veredito fora da escala é erro', () => {
    const d = dadosValidos();
    d.avaliacoes[0]!.veredito = 'Ótimo';
    expect(temErro(verificarQuiz(d), 'VEREDITO_FORA_DA_ESCALA')).toBe(true);
  });

  it('Inviável nos termos propostos não pode ser publicado', () => {
    const d = dadosValidos();
    d.avaliacoes[0]!.veredito = 'Inviável nos termos propostos';
    expect(temErro(verificarQuiz(d), 'INVIAVEL_PUBLICADO')).toBe(true);
  });

  it('justificativa ou fonte vazia é erro', () => {
    const d = dadosValidos();
    d.avaliacoes[0]!.justificativa = ' ';
    expect(temErro(verificarQuiz(d), 'AVALIACAO_VAZIA')).toBe(true);
  });

  it('avaliação de trecho que não existe é erro', () => {
    const d = dadosValidos();
    d.avaliacoes.push({ trecho_id: 'fantasma', criterio_id: 'C1', veredito: 'Parcial', justificativa: 'j', fonte: 'f' });
    expect(temErro(verificarQuiz(d), 'AVALIACAO_ORFA', 'fantasma')).toBe(true);
  });

  it('texto literal que não está no plano original é erro', () => {
    const d = dadosValidos();
    d.lerPlano = () => 'outro texto qualquer';
    expect(temErro(verificarQuiz(d), 'LITERAL_NAO_ENCONTRADO')).toBe(true);
  });

  it('hash que não bate com o texto é erro', () => {
    const d = dadosValidos();
    d.trechos[0]!.hash_texto = 'x'.repeat(64);
    expect(temErro(verificarQuiz(d), 'HASH_DIVERGENTE', d.trechos[0]!.id)).toBe(true);
  });

  it('máscara diferente do esperado é erro', () => {
    const d = dadosValidos();
    d.trechos[0]!.texto_mascarado = 'texto trocado';
    expect(temErro(verificarQuiz(d), 'MASCARA_FORA_DO_PADRAO', d.trechos[0]!.id)).toBe(true);
  });

  it('plano cego ausente ou com apelido diferente do candidato é erro', () => {
    const d = dadosValidos();
    d.planos = d.planos.filter((p) => p.id !== d.trechos[0]!.id);
    expect(temErro(verificarQuiz(d), 'PLANO_AUSENTE', d.trechos[0]!.id)).toBe(true);
    const d2 = dadosValidos();
    d2.planos[0]!.apelido_neutro = 'Candidato Z';
    expect(temErro(verificarQuiz(d2), 'APELIDO_DIVERGENTE', d2.planos[0]!.id)).toBe(true);
  });

  it('nome de candidato ou do partido no texto que o eleitor lê é erro', () => {
    const d = dadosValidos();
    d.planos[0]!.texto_mascarado = 'O governo da Missão fará isso.';
    expect(temErro(verificarQuiz(d), 'NOME_NO_TEXTO', d.planos[0]!.id)).toBe(true);
    const d2 = dadosValidos();
    d2.planos[0]!.contexto_mascarado = 'Segundo o candidato Renan, isso vale.';
    expect(temErro(verificarQuiz(d2), 'NOME_NO_TEXTO', d2.planos[0]!.id)).toBe(true);
  });

  it('nome de programa ou cabeçalho do autor no texto que o eleitor lê é erro', () => {
    const d = dadosValidos();
    d.planos[0]!.texto_mascarado = 'Vamos ampliar o Programa Mais Médicos no país.';
    expect(temErro(verificarQuiz(d), 'NOME_NO_TEXTO', d.planos[0]!.id)).toBe(true);
    const d2 = dadosValidos();
    d2.planos[0]!.contexto_mascarado = 'rodapé LIVRO AMARELO - MISSÃO 2026 e mais texto';
    expect(temErro(verificarQuiz(d2), 'NOME_NO_TEXTO', d2.planos[0]!.id)).toBe(true);
  });

  it('termo interno na justificativa ou na fonte é erro', () => {
    for (const termo of ['revisar_dev', 'rodada', 'staging', 'o dev decidiu', 'provisório']) {
      const d = dadosValidos();
      d.avaliacoes[0]!.justificativa = `Texto com ${termo} no meio.`;
      expect(temErro(verificarQuiz(d), 'TERMO_INTERNO'), termo).toBe(true);
    }
    const d = dadosValidos();
    d.avaliacoes[1]!.fonte = 'plano.md:1; conferido em staging';
    expect(temErro(verificarQuiz(d), 'TERMO_INTERNO')).toBe(true);
  });

  it('a palavra "revisar" como verbo da proposta não é termo interno', () => {
    const d = dadosValidos();
    d.avaliacoes[0]!.justificativa = 'O trecho propõe revisar a divisão dos tributos entre os entes.';
    expect(verificarQuiz(d)).toEqual([]);
  });
});
