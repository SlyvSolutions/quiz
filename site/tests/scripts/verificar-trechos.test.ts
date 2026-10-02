import { describe, it, expect } from 'vitest';
import { validarTrechos } from '../../scripts/verificar-trechos';
import type { Trecho } from '../../src/data/tipos';

describe('verificar-trechos', () => {
  const dummyTrecho: Trecho = {
    id: 'T1',
    candidato_id: 'C1',
    eixo: 'Economia',
    arquivo: 'plano.md',
    linha_inicio: 2,
    linha_fim: 3,
    texto_literal: 'O Brasil cresce',
    texto_mascarado: 'O [***] cresce',
    hash_texto: 'xxx'
  };

  it('retorna ARQUIVO_INEXISTENTE se o leitor voltar null', () => {
    const leitor = () => null; // simulando que o arquivo não existe
    const erros = validarTrechos([dummyTrecho], leitor);
    expect(erros).toHaveLength(1);
    expect(erros[0]).toContain('ARQUIVO_INEXISTENTE');
  });

  it('retorna TRECHO_NAO_ENCONTRADO se o trecho literal não existir nas linhas dadas', () => {
    const leitor = () => 'Linha 1\nOutra coisa na linha 2\nOutra na 3\n';
    const erros = validarTrechos([dummyTrecho], leitor);
    expect(erros).toHaveLength(1);
    expect(erros[0]).toContain('TRECHO_NAO_ENCONTRADO');
  });

  it('retorna vazio (sucesso) se o trecho literal existir no arquivo e no intervalo de linhas', () => {
    const leitor = () => 'Linha 1 irrelevante\nAlgum texto. O Brasil cresce hoje.\nContinuando linha 3\n';
    const erros = validarTrechos([dummyTrecho], leitor);
    expect(erros).toHaveLength(0); // sucesso
  });

  it('tolera formatação e quebras de linha devido à normalização', () => {
    const trechoComQuebra = { ...dummyTrecho, texto_literal: 'O Brasil\ncresce' };
    const leitor = () => 'L1\nO Brasil    \n cresce \nL4';
    const erros = validarTrechos([trechoComQuebra], leitor);
    expect(erros).toHaveLength(0);
  });
});
