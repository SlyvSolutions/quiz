import { describe, it, expect } from 'vitest';
import { mascararNomes } from '../../src/core/mascarar-nomes';

describe('mascararNomes', () => {
  it('oculta nomes de candidatos e siglas de partido', () => {
    expect(mascararNomes('O governo Lula e o PT, com Flávio Bolsonaro e o PL')).toBe(
      'O governo [***] e o [***], com [***] e o [***]'
    );
    expect(mascararNomes('Ronaldo Caiado, Augusto Cury e Renan Santos')).toBe('[***], [***] e [***]');
    expect(mascararNomes('o Partido Missão e a União Brasil')).toBe('o [***] e a [***]');
  });

  it('nao mexe em palavras que so contem as letras', () => {
    const t = 'acesso via celular, optar pela regulação e o plano público';
    expect(mascararNomes(t)).toBe(t);
  });

  it('nao altera texto sem nomes', () => {
    const t = 'A taxa de juros é hoje o que a inflação foi no passado.';
    expect(mascararNomes(t)).toBe(t);
  });

  it('oculta o nome do partido Missão mesmo sem a palavra Partido, mas nao a palavra comum missão', () => {
    expect(mascararNomes('o governo da Missão vai agir')).toBe('o governo da [***] vai agir');
    expect(mascararNomes('SOLUÇÕES DA MISSÃO para o país')).toBe('SOLUÇÕES DA [***] para o país');
    expect(mascararNomes('o plano industrial da Missão e o partido Missão')).toBe('o plano industrial da [***] e o partido [***]');
    const comum = 'a missão do Estado é cumprir a missão constitucional';
    expect(mascararNomes(comum)).toBe(comum);
  });

  it('oculta o primeiro nome Flávio sozinho, sem duplicar o marcador quando vem com o sobrenome', () => {
    expect(mascararNomes('Flávio propõe reduzir impostos')).toBe('[***] propõe reduzir impostos');
    expect(mascararNomes('o governo de Flávio Bolsonaro')).toBe('o governo de [***]');
  });

  describe('identificadores diretos que vão além dos nomes', () => {
    it('cabeçalho e rodapé que carregam o autor viram um marcador só', () => {
      expect(mascararNomes('texto anterior LIVRO AMARELO - MISSÃO 2026 texto seguinte')).toBe('texto anterior [***] texto seguinte');
      expect(mascararNomes('PROPOSTAS E SOLUÇÕES DA MISSÃO A orientação principal')).toBe('[***] A orientação principal');
      expect(mascararNomes('fim da página Plano de Governo 2027 a 2030 · PSD · Caiado e Kassab\nPróxima página')).toBe(
        'fim da página [***]\nPróxima página'
      );
      expect(mascararNomes('    P R O G R A M A   D E   G OV E R N O\nTexto')).toBe('    [***]\nTexto');
      expect(mascararNomes('o Livro Amarelo propõe')).toBe('o [***] propõe');
    });

    it('nomes de políticos e o instituto do próprio autor', () => {
      expect(mascararNomes('o presidente do PSD, Gilberto Kassab, e o deputado Kim Kataguiri')).toBe(
        'o presidente do [***], [***], e o deputado [***]'
      );
      expect(mascararNomes('o Centro de Debate de Políticas Públicas (CDPP) publicou')).toBe('o [***] publicou');
      expect(mascararNomes('estudo do CDPP')).toBe('estudo do [***]');
    });

    it('autorreferência de quem governa ou vai governar', () => {
      expect(mascararNomes('Em nosso governo e na nossa gestão, vamos agir')).toBe('Em [***] e na [***], vamos agir');
      expect(mascararNomes('Na atual gestão e no nosso mandato')).toBe('Na [***] e no [***]');
      expect(mascararNomes('No atual mandato, e no próximo mandato, e no novo mandato')).toBe('No [***], e no [***], e no [***]');
      expect(mascararNomes('do senador e futuro presidente do Brasil, Flávio Bolsonaro, que propôs')).toBe('do [***], que propôs');
    });

    it('o estado-sede do autor', () => {
      expect(mascararNomes('Em Goiás, o modelo funcionou; o programa goiano reduziu')).toBe('Em [***], o modelo funcionou; o programa [***] reduziu');
    });

    it('nao mascara o que e comum, institucional ou de outro estado', () => {
      const t =
        'o mandato de oito anos dos ministros, ao longo do mandato, a gestão pública, o governo anterior, nossa proposta, Goiânia, o Ceará e a missão do Estado';
      expect(mascararNomes(t)).toBe(t);
      const inst = 'o STF, o BNDES, o SUS, o INSS, a Constituição, o art. 18 da CF e a Lei Antifacção';
      expect(mascararNomes(inst)).toBe(inst);
    });
  });
});
