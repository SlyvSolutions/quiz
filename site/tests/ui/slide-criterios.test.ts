// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { criarSlideCriterios } from '../../src/ui/slide-criterios';
import type { AvaliacaoPublica } from '../../src/core/votos';

const criterios = ['C1', 'C2', 'C3', 'C4', 'C5'].map((id, i) => ({ id, nome: `Critério ${i + 1}` }));
const av = (c: string, v: string): AvaliacaoPublica => ({
  trecho_id: 't',
  criterio_id: c,
  veredito: v,
  justificativa: `just ${c}`,
  fonte: 'f',
});
const cinco = [
  av('C3', 'Parcial'),
  av('C1', 'Sem base para avaliar'),
  av('C2', 'Viável'),
  av('C5', 'Sem base para avaliar'),
  av('C4', 'Sem base para avaliar'),
];

describe('criarSlideCriterios', () => {
  it('mostra os 5 critérios em ordem, com texto do veredito e justificativa', () => {
    const raiz = criarSlideCriterios(cinco, criterios);
    const itens = [...raiz.querySelectorAll('.slide-criterios-item')];
    expect(itens).toHaveLength(5);
    expect(itens[0]!.textContent).toContain('Critério 1');
    expect(itens[0]!.textContent).toContain('Sem base para avaliar');
    expect(itens[2]!.textContent).toContain('Parcial');
    expect(itens[1]!.textContent).toContain('just C2');
  });

  it('traz o selo de concretude (2 de 5 avaliados)', () => {
    const raiz = criarSlideCriterios(cinco, criterios);
    const selos = raiz.querySelector('.slide-criterios-selos')!;
    expect(selos.querySelectorAll('.selo-concretude').length).toBe(1);
    expect(selos.textContent).toContain('CONCRETUDE 2 de 5');
  });

  it('nenhum critério avaliado dá concretude 0 de 5 ', () => {
    const nenhum = ['C1', 'C2', 'C3', 'C4', 'C5'].map((c) => av(c, 'Sem base para avaliar'));
    const raiz = criarSlideCriterios(nenhum, criterios);
    expect(raiz.querySelector('.selo-concretude')?.textContent).toMatch(/CONCRETUDE 0 de 5/);
  });

  it('o veredito tem ícone, nunca só cor', () => {
    const raiz = criarSlideCriterios(cinco, criterios);
    for (const badge of raiz.querySelectorAll('.slide-criterios-badge')) {
      expect(badge.querySelector('svg')).not.toBeNull();
    }
  });

  it('sem avaliação mostra mensagem neutra e não quebra', () => {
    const raiz = criarSlideCriterios([], criterios);
    expect(raiz.querySelector('.slide-criterios-vazio')!.textContent).toContain('Ainda não há avaliação');
    expect(raiz.querySelectorAll('.slide-criterios-item')).toHaveLength(0);
    expect(raiz.querySelector('.slide-criterios-selos')).toBeNull();
  });

  it('veredito desconhecido não quebra e usa o ícone de dúvida', () => {
    const raiz = criarSlideCriterios([av('C1', 'Algo novo')], criterios);
    expect(raiz.querySelectorAll('.slide-criterios-item')).toHaveLength(1);
    expect(raiz.querySelector('.slide-criterios-badge svg')).not.toBeNull();
  });

  it('não revela autor: nenhum nome, partido ou apelido no texto', () => {
    const raiz = criarSlideCriterios(cinco, criterios);
    const t = raiz.textContent ?? '';
    for (const proibido of ['Lula', 'Flávio', 'Caiado', 'Renan', 'Cury', 'Missão', 'Candidato A', 'Plano 1']) {
      expect(t).not.toContain(proibido);
    }
  });

  describe('máscara na justificativa (política: mascarado na escolha, original no Resultado)', () => {
    const avComTermos = (just: string): AvaliacaoPublica[] => [
      { trecho_id: 't', criterio_id: 'C1', veredito: 'Parcial', justificativa: just, fonte: 'Lula_Plano_Original.md:10-12' },
    ];
    const txt = 'O trecho cita o Programa Mais Médicos e o Novo PAC; no nosso governo, Lula repete a meta.';

    it('por padrão (verso do quiz) mascara nomes, programas e autorreferência na justificativa', () => {
      const t = criarSlideCriterios(avComTermos(txt), criterios).textContent ?? '';
      expect(t).toContain('[programa federal de atenção médica]');
      expect(t).toContain('[programa federal de investimentos em infraestrutura]');
      expect(t).toContain('no [***], [***] repete a meta');
      for (const termo of ['Mais Médicos', 'Novo PAC', 'Lula', 'nosso governo']) expect(t).not.toContain(termo);
    });

    it('nunca mostra a fonte da avaliação (o nome do arquivo revela o autor)', () => {
      const t = criarSlideCriterios(avComTermos(txt), criterios).textContent ?? '';
      expect(t).not.toContain('Plano_Original');
      expect(t).not.toContain('.md');
      const o = criarSlideCriterios(avComTermos(txt), criterios, { original: true }).textContent ?? '';
      expect(o).not.toContain('Plano_Original');
    });

    it('no Resultado (original: true) mostra a justificativa literal, sem máscara', () => {
      const t = criarSlideCriterios(avComTermos(txt), criterios, { original: true }).textContent ?? '';
      expect(t).toContain(txt);
    });

    it('justificativa sem nada a esconder é igual nos dois modos', () => {
      const a = avComTermos('O trecho traz meta, sem valor nem fonte de recurso.');
      expect(criarSlideCriterios(a, criterios).textContent).toBe(criarSlideCriterios(a, criterios, { original: true }).textContent);
    });
  });
});
