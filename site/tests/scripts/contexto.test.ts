import { describe, it, expect } from 'vitest';
import { expandirContexto, ehLinhaDePagina, semNumerosDePagina } from '../../scripts/contexto';

const ARQUIVO = [
  '3. Proteger a vida com mais eficiência', // 1
  '', // 2
  'A segurança é um direito de todos. O compromisso do governo é proteger a vida e', // 3
  'garantir a cidadania.', // 4
  '', // 5
  'A segurança pública exige coordenação federativa, integração de dados e', // 6
  '', // 7
  '', // 8
  '26', // 9
  'políticas baseadas em evidências.', // 10
  '', // 11
  'Outro assunto sem relação alguma.', // 12
];

describe('contexto ampliado', () => {
  it('reconhece e remove linhas de número de página', () => {
    expect(ehLinhaDePagina('  26 ')).toBe(true);
    expect(ehLinhaDePagina('26 de março')).toBe(false);
    expect(semNumerosDePagina(['a', '12', 'b'])).toEqual(['a', 'b']);
  });

  it('pega o parágrafo do trecho, cola o que a quebra de página cortou e abre com o título', () => {
    const c = expandirContexto(ARQUIVO, 3, 4, 'O compromisso do governo é proteger a vida e garantir a cidadania.', {
      minimo: 300,
      maximo: 900,
    });
    const paragrafos = c.texto.split('\n\n');
    expect(paragrafos[0]).toBe('3. Proteger a vida com mais eficiência');
    expect(c.texto).toContain('O compromisso do governo é proteger a vida e garantir a cidadania.');
    // o parágrafo vizinho, que uma página cortou no meio, volta inteiro e sem o número
    expect(c.texto).toContain('integração de dados e políticas baseadas em evidências.');
    expect(c.texto).not.toMatch(/\b26\b/);
    expect(c.linha_inicio).toBe(1);
    expect(c.linha_fim).toBeGreaterThanOrEqual(10);
  });

  it('respeita o teto e mantém o trecho dentro, cortando em fronteira de frase', () => {
    const longo = ['Primeira frase. '.repeat(3) + 'A frase alvo está aqui. ' + 'Frase depois. '.repeat(40)];
    const c = expandirContexto(longo, 1, 1, 'A frase alvo está aqui.', { minimo: 100, maximo: 300 });
    expect(c.texto.length).toBeLessThanOrEqual(300);
    expect(c.texto).toContain('A frase alvo está aqui.');
    expect(c.texto.endsWith('.')).toBe(true);
  });

  it('falha de forma clara quando nenhuma linha cobre o trecho', () => {
    expect(() => expandirContexto(['a'], 50, 60, 'x')).toThrow();
  });
});
