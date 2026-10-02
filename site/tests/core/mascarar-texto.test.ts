import { describe, it, expect } from 'vitest';
import { mascararTexto, conferirMascaraTexto, dividirMarcadores, termosRemanescentes } from '../../src/core/mascarar-texto';

describe('mascararTexto', () => {
  it('aplica identificadores diretos ([***]) e rótulos de programas num passo só', () => {
    const t = 'No nosso governo, o Programa Mais Médicos de Lula chega a Goiás pelo Novo PAC.';
    expect(mascararTexto(t)).toBe(
      'No [***], o [programa federal de atenção médica] de [***] chega a [***] pelo [programa federal de investimentos em infraestrutura].'
    );
  });

  it('é idempotente: mascarar de novo o texto já mascarado nao muda nada', () => {
    const t = 'Em nossa gestão, o Muralha Brasileira e o Plano Pena Justa, com Caiado e o PSD, LIVRO AMARELO - MISSÃO 2026';
    const uma = mascararTexto(t);
    expect(mascararTexto(uma)).toBe(uma);
  });

  it('texto sem nada a esconder fica igual', () => {
    const t = 'A taxa de juros é hoje o que a inflação foi no passado no Brasil, conforme o art. 18 da Constituição e o STF.';
    expect(mascararTexto(t)).toBe(t);
  });
});

describe('conferirMascaraTexto', () => {
  it('aceita rótulo como ocultação, como o marcador', () => {
    const literal = 'Lançamos o MEC Livros e o MEC Idiomas, no governo de Lula.';
    const r = conferirMascaraTexto(literal, mascararTexto(literal));
    expect(r.valido).toBe(true);
    expect(r.nadaOcultado).toBe(false);
    expect(r.ocultados).toEqual(['MEC Livros', 'MEC Idiomas', 'Lula']);
  });

  it('reprova rótulo que nao corresponde a nada ocultado ou texto alterado fora dos marcadores', () => {
    expect(conferirMascaraTexto('o texto é este', 'o texto é [programa federal de atenção médica] aquele').valido).toBe(false);
    expect(conferirMascaraTexto('sem nada', 'sem nada').nadaOcultado).toBe(true);
  });
});

describe('dividirMarcadores', () => {
  it('separa texto comum de marcador ([***] e rótulos) para destacar na revelação', () => {
    expect(dividirMarcadores('a [***] b [programa federal de atenção médica] c')).toEqual([
      { texto: 'a ', marcado: false },
      { texto: '[***]', marcado: true },
      { texto: ' b ', marcado: false },
      { texto: '[programa federal de atenção médica]', marcado: true },
      { texto: ' c', marcado: false },
    ]);
    expect(dividirMarcadores('sem nada')).toEqual([{ texto: 'sem nada', marcado: false }]);
  });
});

describe('termosRemanescentes', () => {
  it('lista o que ainda seria mascarado (para os verificadores)', () => {
    expect(termosRemanescentes('já mascarado: [***] e [programa federal de atenção médica]')).toEqual([]);
    expect(termosRemanescentes('Mais Médicos e Lula')).toEqual(['Mais Médicos', 'Lula']);
  });
});
