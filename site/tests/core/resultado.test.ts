import { describe, it, expect } from 'vitest';
import { calcularResultado } from '../../src/core/resultado';

describe('calcularResultado', () => {
  const candidatos = ['A', 'B', 'C', 'D'];

  it('8 escolhas (4 do A, 3 do B, 1 do C) e 2 puladas dão A 50%, B 37,5% e C 12,5% com total 8', () => {
    const respostas = [
      'A', 'A', 'A', 'A', // 4 de A
      'B', 'B', 'B',      // 3 de B
      'C',                // 1 de C
      'pular', 'pular'  // 2 respostas puladas
    ];
    
    const resultado = calcularResultado(respostas, candidatos);
    
    expect(resultado.totalValidas).toBe(8);
    expect(resultado.basePequena).toBe(false); // >= 5 é false
    expect(resultado.percentuais['A']).toBe(50);
    expect(resultado.percentuais['B']).toBe(37.5);
    expect(resultado.percentuais['C']).toBe(12.5);
    expect(resultado.percentuais['D']).toBeUndefined();
    expect(resultado.vencedores).toEqual(['A']);
  });

  it('zero escolhas de candidato não devolve percentual', () => {
    const respostas = ['pular', 'pular', 'pular'];
    const resultado = calcularResultado(respostas, candidatos);
    
    expect(resultado.totalValidas).toBe(0);
    expect(resultado.basePequena).toBe(true);
    expect(Object.keys(resultado.percentuais).length).toBe(0);
    expect(resultado.vencedores.length).toBe(0);
  });

  it('empate na maior afinidade devolve todos os empatados', () => {
    const respostas = ['A', 'A', 'B', 'B', 'C'];
    const resultado = calcularResultado(respostas, candidatos);
    
    expect(resultado.vencedores).toContain('A');
    expect(resultado.vencedores).toContain('B');
    expect(resultado.vencedores.length).toBe(2);
  });

  it('opção inexistente é descartada', () => {
    const respostas = ['A', 'A', 'inexistente', 'B', 'outra_coisa', 'A'];
    const resultado = calcularResultado(respostas, candidatos);
    
    expect(resultado.totalValidas).toBe(4); // 3 do A e 1 do B
    expect(resultado.basePequena).toBe(true);
    expect(resultado.percentuais['inexistente']).toBeUndefined();
    expect(resultado.percentuais['A']).toBe(75);
    expect(resultado.percentuais['B']).toBe(25);
  });

  it('menos de 5 respostas sinaliza base pequena', () => {
    // Exatamente 5 validas -> não é base pequena
    let res = calcularResultado(['A', 'A', 'B', 'B', 'C'], candidatos);
    expect(res.basePequena).toBe(false);

    // 4 validas -> é base pequena
    res = calcularResultado(['A', 'A', 'B', 'B'], candidatos);
    expect(res.basePequena).toBe(true);
  });
});
