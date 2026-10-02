import { describe, it, expect } from 'vitest';
import { validarMascaras } from '../../scripts/verificar-mascaras';
import type { Trecho } from '../../src/data/tipos';

describe('verificar-mascaras', () => {
  it('deve retornar vazio quando nao ha erros', () => {
    const trechos: Trecho[] = [
      {
        id: '1', candidato_id: 'c1',
        eixo: 'Segurança',
        arquivo: 'foo.md',
        linha_inicio: 1,
        linha_fim: 1,
        pagina_pdf: 1,
        texto_literal: 'Vou combater o crime com força e inteligência',
        texto_mascarado: 'Vou combater o crime com [***] e [***]',
        hash_texto: 'abc'
      },
      {
        id: '2', candidato_id: 'c2',
        eixo: 'Economia',
        arquivo: 'bar.md',
        linha_inicio: 2,
        linha_fim: 2,
        pagina_pdf: 2,
        texto_literal: 'Sem máscara',
        texto_mascarado: 'Sem máscara',
        hash_texto: 'def'
      }
    ];

    const erros = validarMascaras(trechos);
    expect(erros).toHaveLength(0);
  });

  it('deve retornar erro quando mascara vai alem dos marcadores', () => {
    const trechos: Trecho[] = [
      {
        id: '1', candidato_id: 'c1',
        eixo: 'Segurança',
        arquivo: 'foo.md',
        linha_inicio: 1,
        linha_fim: 1,
        pagina_pdf: 1,
        texto_literal: 'Vou combater o crime com força e inteligência',
        // Mascarado alterou uma palavra além dos marcadores (crimes vs crime)
        texto_mascarado: 'Vou combater o crimes com [***] e [***]',
        hash_texto: 'abc'
      }
    ];

    const erros = validarMascaras(trechos);
    expect(erros).toHaveLength(1);
    expect(erros[0]).toContain('MASCARA_FORA_DO_PADRAO');
  });

  it('reprova contexto cuja diferenca vai alem dos marcadores', () => {
    const base = {
      id: 'x', candidato_id: 'lula', eixo: 'Saúde', arquivo: 'Lula_Plano_Original.md',
      linha_inicio: 1, linha_fim: 2, texto_literal: 'Lula defende o SUS', texto_mascarado: '[***] defende o SUS', hash_texto: 'h',
    };
    const ruim = validarMascaras([
      { ...base, contexto_literal: 'Lula defende o SUS forte', contexto_mascarado: '[***] defende o SUS fraco' } as Trecho,
    ]);
    expect(ruim.some((e) => e.includes('CONTEXTO_MASCARA_FORA_DO_PADRAO'))).toBe(true);
    const bom = validarMascaras([
      { ...base, contexto_literal: 'Lula defende o SUS forte', contexto_mascarado: '[***] defende o SUS forte' } as Trecho,
    ]);
    expect(bom).toEqual([]);
  });

  it('aceita o rótulo neutro de programa como ocultação, como o marcador', () => {
    const trechos: Trecho[] = [
      {
        id: '1', candidato_id: 'c1', eixo: 'Educação', arquivo: 'foo.md', linha_inicio: 1, linha_fim: 1, pagina_pdf: 1,
        texto_literal: 'Lançamos o MEC Livros, no governo de Lula.',
        texto_mascarado: 'Lançamos o [programa federal de livros digitais], no governo de [***].',
        hash_texto: 'abc',
      },
    ];
    expect(validarMascaras(trechos)).toHaveLength(0);
  });

  it('rótulo que nao corresponde ao que foi ocultado, ou texto alterado perto dele, é erro', () => {
    const trechos: Trecho[] = [
      {
        id: '1', candidato_id: 'c1', eixo: 'Educação', arquivo: 'foo.md', linha_inicio: 1, linha_fim: 1, pagina_pdf: 1,
        texto_literal: 'Lançamos o MEC Livros hoje.',
        texto_mascarado: 'Criamos o [programa federal de livros digitais] hoje.',
        hash_texto: 'abc',
      },
    ];
    expect(validarMascaras(trechos).some((e) => e.includes('MASCARA_FORA_DO_PADRAO'))).toBe(true);
  });
});
