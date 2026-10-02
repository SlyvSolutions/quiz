import { describe, it, expect } from 'vitest';
import { localizarTrecho } from '../../scripts/extrair-trecho';

describe('extrair-trecho', () => {
  it('deve retornar null se o trecho nao existir', () => {
    const conteudo = 'um texto qualquer';
    const resultado = localizarTrecho(conteudo, 'inexistente');
    expect(resultado).toBeNull();
  });

  it('deve localizar linha exata de um trecho', () => {
    const conteudo = 'linha 1\nlinha 2\nlinha 3: o texto procurado esta aqui\nlinha 4';
    const resultado = localizarTrecho(conteudo, 'texto procurado esta aqui');
    expect(resultado).not.toBeNull();
    expect(resultado?.linha_inicio).toBe(3);
    expect(resultado?.linha_fim).toBe(3);
    expect(resultado?.pagina_pdf).toBeNull();
  });

  it('deve mapear multiplas linhas corretamente', () => {
    const conteudo = '10\nQualquer lixo\nEste é um trecho longo\nque quebra de linha\ne continua aqui.\nMais texto.';
    const resultado = localizarTrecho(conteudo, 'Este é um trecho longo que quebra de linha e continua aqui');
    expect(resultado).not.toBeNull();
    expect(resultado?.linha_inicio).toBe(3);
    expect(resultado?.linha_fim).toBe(5);
    expect(resultado?.pagina_pdf).toBe(10);
  });

  it('deve ignorar espacos e normalizacao', () => {
    const conteudo = '22\n\n\n\nVamos      fazer\num \n\n \t\n teste';
    const resultado = localizarTrecho(conteudo, 'Vamos fazer um teste');
    expect(resultado).not.toBeNull();
    expect(resultado?.linha_inicio).toBe(5);
    expect(resultado?.linha_fim).toBe(9);
    expect(resultado?.pagina_pdf).toBe(22);
  });

  it('deve atravessar um numero de pagina isolado em linha propria entre duas palavras', () => {
    const conteudo = '36\nA proposta revisa a divisao dos tributos entre os entes\n37\ne define novos criterios de repasse.\nOutro paragrafo.';
    const resultado = localizarTrecho(conteudo, 'A proposta revisa a divisao dos tributos entre os entes e define novos criterios de repasse.');
    expect(resultado).not.toBeNull();
    expect(resultado?.linha_inicio).toBe(2);
    expect(resultado?.linha_fim).toBe(4);
  });

  it('nao deve ignorar numero que esta no meio de uma linha de texto', () => {
    const conteudo = 'A meta e de 37 por cento ate 2030.';
    expect(localizarTrecho(conteudo, 'A meta e de por cento ate 2030.')).toBeNull();
  });

  it('deve atravessar um marcador de lista isolado em linha propria entre duas palavras', () => {
    const conteudo = 'Texto antes.\nA rede ampliara a oferta de consultas\n•\ne reduzira o tempo de espera.\nFim.';
    const resultado = localizarTrecho(conteudo, 'A rede ampliara a oferta de consultas e reduzira o tempo de espera.');
    expect(resultado).not.toBeNull();
    expect(resultado?.linha_inicio).toBe(2);
    expect(resultado?.linha_fim).toBe(4);
  });

  it('deve tolerar o marcador de lista no inicio de um item, sem que ele faca parte do texto procurado', () => {
    const conteudo = 'Antes.\n• Construir a identidade clinica digital em todo o pais.\n• Adotar padroes abertos e seguranca cibernetica.\nDepois.';
    const resultado = localizarTrecho(conteudo, 'Construir a identidade clinica digital em todo o pais. Adotar padroes abertos e seguranca cibernetica.');
    expect(resultado).not.toBeNull();
    expect(resultado?.linha_inicio).toBe(2);
    expect(resultado?.linha_fim).toBe(3);
  });
});
