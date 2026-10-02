import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { ROTULOS_PROGRAMAS, mascararProgramas } from '../../src/core/rotulos-programas';
import { mascararNomes } from '../../src/core/mascarar-nomes';

describe('mascararProgramas', () => {
  it('troca nome de programa por rótulo neutro descritivo, nunca por [***]', () => {
    expect(mascararProgramas('Reforçaremos o Programa Mais Médicos e o Brasil Sorridente.')).toBe(
      'Reforçaremos o [programa federal de atenção médica] e o [programa federal de saúde bucal].'
    );
    expect(mascararProgramas('Lançamos o MEC Livros e o MEC Idiomas.')).toBe(
      'Lançamos o [programa federal de livros digitais] e o [programa federal de ensino de idiomas].'
    );
    expect(mascararProgramas('o Plano Pena Justa')).toBe('o [plano de segurança prisional]');
    expect(mascararProgramas('Muralha Brasileira, inspirado no Smart Sampa')).toBe(
      '[sistema nacional de reconhecimento facial], inspirado no [programa municipal de câmeras com reconhecimento facial]'
    );
    expect(mascararProgramas('polícia FOCO - Força de Combate Preventivo, e o Programa FATO – Força de Alerta Total')).toBe(
      '[polícia municipal preventiva], e o [programa de integração das forças policiais]'
    );
    expect(mascararProgramas('Criação do PRONTO (Prontuário Eletrônico Nacional Interoperável) que irá conectar')).toBe(
      'Criação do [prontuário eletrônico nacional] que irá conectar'
    );
    expect(mascararProgramas('PROJETO 13 - TELE SAÚDE BRASIL: TRANSFORMAR')).toBe('[programa nacional de telemedicina]: TRANSFORMAR');
    expect(mascararProgramas('Aplicar o Regime Especial Disciplinar Antiterrorismo Doméstico (REDAD), com isolamento')).toBe(
      'Aplicar o [regime disciplinar especial para lideranças criminosas], com isolamento'
    );
  });

  it('nao mascara leis, normas, instituições públicas, siglas de órgãos, dados e fontes', () => {
    const t = [
      'a Lei Antifacção, a Lei 14.133/2021 e o art. 18 da Constituição',
      'o STF, o BNDES, o SUS, o INSS, o BNCC, o FUNDEB, o COAF e a Polícia Federal',
      'o Plano Safra, o Bolsa Família, o Programa de Subvenção ao Prêmio do Seguro Rural e a PEC 188/2019',
      'dados do IBGE e do Saeb; fonte: Tesouro Nacional',
      'o fato é que a polícia foco-se, a pronto atendimento e o pronto-socorro',
    ].join('\n');
    expect(mascararProgramas(t)).toBe(t);
  });

  it('o dicionário publicado nao traz o campo candidato (so docs/ guarda o mapeamento)', () => {
    for (const e of ROTULOS_PROGRAMAS) {
      expect(Object.keys(e).sort()).toEqual(['flags', 'id', 'padrao', 'rotulo']);
    }
    const bruto = fs.readFileSync(path.join(import.meta.dirname, '../../src/data/rotulos-programas.json'), 'utf-8');
    expect(bruto).not.toMatch(/candidato/i);
    expect(bruto).not.toMatch(/lula|flavio|flávio|caiado|renan|cury/i);
  });

  it('ids unicos e padrões validos', () => {
    const ids = ROTULOS_PROGRAMAS.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const e of ROTULOS_PROGRAMAS) expect(() => new RegExp(e.padrao, e.flags)).not.toThrow();
  });

  it('cada rótulo é neutro: entre colchetes, sem [***], sem nome de autor/partido e sem casar com o próprio dicionário', () => {
    for (const e of ROTULOS_PROGRAMAS) {
      const marcado = `[${e.rotulo}]`;
      expect(e.rotulo.length).toBeGreaterThan(8);
      expect(e.rotulo).not.toMatch(/\[|\]|\*/);
      // nenhum identificador direto dentro do rótulo
      expect(mascararNomes(marcado)).toBe(marcado);
      // rótulo nao é de novo trocado por nenhuma entrada (idempotência)
      expect(mascararProgramas(marcado)).toBe(marcado);
      // palavras que identificam o autor
      expect(e.rotulo).not.toMatch(/lula|bolsonaro|fl[áa]vio|caiado|cury|renan|miss[ãa]o|goi[áa]s|petis|governo atual/i);
    }
  });

  it('o dicionário é igual para todos: o mapeamento de auditoria cobre exatamente os mesmos ids e os 5 candidatos', () => {
    const auditoria = JSON.parse(
      fs.readFileSync(path.join(import.meta.dirname, '../../../docs/avaliacao/mascara-programas-auditoria.json'), 'utf-8')
    ) as { id: string; candidato: string; origem: string }[];
    expect(auditoria.map((a) => a.id).sort()).toEqual(ROTULOS_PROGRAMAS.map((e) => e.id).sort());
    const porCandidato = new Map<string, number>();
    for (const a of auditoria) porCandidato.set(a.candidato, (porCandidato.get(a.candidato) ?? 0) + 1);
    expect([...porCandidato.keys()].sort()).toEqual(['caiado', 'cury', 'flavio', 'lula', 'renan']);
    for (const n of porCandidato.values()) expect(n).toBeGreaterThanOrEqual(3);
  });
});
