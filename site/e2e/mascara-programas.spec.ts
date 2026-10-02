import { test, expect, type Page } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { mascararNomes } from '../src/core/mascarar-nomes';

/**
 * Política de máscara no navegador: durante a escolha (teste cego e quiz) nenhum termo do dicionário de programas
 * nem identificador direto do autor pode estar no DOM; no Resultado, o painel "Ver voto a voto" mostra o original.
 * Também mede estouro de largura e erros de console no percurso completo, em celular e em desktop.
 */
const dados = path.join(import.meta.dirname, '../public/data');
const ler = <T>(f: string): T => JSON.parse(fs.readFileSync(path.join(dados, f), 'utf-8')) as T;

const DIC = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, '../src/data/rotulos-programas.json'), 'utf-8')) as {
  id: string;
  padrao: string;
  flags: string;
  rotulo: string;
}[];
const REGEX_DIC = DIC.map((e) => new RegExp(e.padrao, e.flags));
const norm = (s: string) => s.replace(/\s+/g, ' ').trim();

/** Termos do dicionário e identificadores diretos presentes no texto (vazio = nada a esconder). */
function termosNoTexto(texto: string): string[] {
  const achados: string[] = [];
  for (const re of REGEX_DIC) for (const m of texto.matchAll(re)) achados.push(m[0]);
  const semProgramas = REGEX_DIC.reduce((t, re) => t.replace(re, ' '), texto);
  if (mascararNomes(semProgramas) !== semProgramas) achados.push('identificador direto');
  return achados;
}

interface Trecho { id: string; texto_literal: string }
interface Plano { id: string; texto_mascarado: string }
interface Aval { trecho_id: string; justificativa: string }
const trechosQuiz = ler<Trecho[]>('trechos_quiz.json');
const planosQuiz = ler<Plano[]>('planos_cegos_quiz.json');
const avaliacoesQuiz = ler<Aval[]>('avaliacoes_quiz.json');
const idPorTexto = new Map(planosQuiz.map((p) => [norm(`"${p.texto_mascarado}"`), p.id]));
const temProgramaNoOriginal = (id: string) =>
  termosNoTexto(trechosQuiz.find((t) => t.id === id)?.texto_literal ?? '').length > 0 ||
  avaliacoesQuiz.some((a) => a.trecho_id === id && termosNoTexto(a.justificativa).length > 0);

async function estouro(page: Page): Promise<number> {
  return page.evaluate(() => {
    const raiz = document.documentElement;
    const painel = document.querySelector<HTMLElement>('.ui-slide-panel.open');
    return Math.max(raiz.scrollWidth - raiz.clientWidth, document.body.scrollWidth - raiz.clientWidth, painel ? painel.scrollWidth - painel.clientWidth : 0);
  });
}

for (const vp of [{ largura: 360, altura: 640 }, { largura: 1280, altura: 800 }]) {
  test(`percurso completo em ${vp.largura}x${vp.altura}: sem termo do autor no DOM antes do Resultado, original no painel, sem estouro nem erro`, async ({ page }) => {
    test.setTimeout(240_000);
    expect(DIC.length).toBeGreaterThan(0);
    await page.setViewportSize({ width: vp.largura, height: vp.altura });
    const erros: string[] = [];
    page.on('console', (m) => { if (m.type() === 'error') erros.push(m.text()); });
    page.on('pageerror', (e) => erros.push(String(e)));

    await page.goto('/quiz/');
    await page.getByRole('button', { name: /pular introdução/i }).click();

    // Teste cego: os cinco planos, com contexto, sem termo do dicionário nem identificador do autor
    await expect(page.locator('button', { hasText: 'Escolher' })).toHaveCount(5);
    const cards = await page.locator('.tc-card').allTextContents();
    expect(cards.length).toBeGreaterThanOrEqual(5);
    for (const c of cards) expect(termosNoTexto(c)).toEqual([]);
    // O painel "Ler plano completo" de cada plano traz os cinco eixos com o parágrafo em volta
    const planosLidos = await page.locator('.tc-card .btn-resumo').count();
    for (let i = 0; i < planosLidos; i++) {
      await page.locator('.tc-card .btn-resumo').nth(i).click();
      const aberto = page.locator('.ui-slide-panel.open');
      await expect(aberto).toBeVisible();
      expect(termosNoTexto((await aberto.textContent()) ?? '')).toEqual([]);
      await page.locator('.ui-slide-close').click();
      await expect(page.locator('.ui-slide-panel.open')).toHaveCount(0);
    }
    expect(await estouro(page)).toBe(0);
    for (let i = 0; i < 5; i++) {
      const botoes = page.locator('button', { hasText: 'Escolher' });
      await botoes.first().click();
      await expect(botoes).toHaveCount(4 - i);
    }
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent?.includes('PRONTO'));
      if (btn) btn.click();
    });
    await expect(page.locator('h2')).toContainText('A Grande Revelação');
    // Revelação: os nomes aparecem de propósito (autor revelado); só confere que não estoura
    expect(await estouro(page)).toBe(0);
    await page.getByRole('button', { name: /AVANÇAR PARA O QUIZ/i }).click({ force: true });

    // Quiz: em cada pergunta, escolhe de preferência o trecho com programa no original, e vigia o DOM antes e depois do giro
    const total = Number(/de (\d+)/.exec((await page.locator('.quiz-step-text').textContent()) ?? '')?.[1]);
    expect(total).toBe(15);
    const escolhidos: string[] = [];
    for (let i = 0; i < total; i++) {
      await expect(page.locator('.quiz-question')).toBeVisible();
      const opcoes = await page.locator('.quiz-option-content').allTextContents();
      const ids = opcoes.map((o) => idPorTexto.get(norm(o)));
      expect(ids.every(Boolean), 'toda opção do quiz casa com um plano cego').toBe(true);
      expect(termosNoTexto(await page.locator('.quiz-options').innerText())).toEqual([]);
      const alvo = Math.max(0, ids.findIndex((id) => id && temProgramaNoOriginal(id)));
      escolhidos.push(ids[alvo]!);
      await page.locator('.quiz-option-content').nth(alvo).click();
      await expect(page.locator('.quiz-verso')).toHaveCount(1);
      // card virado: verso com justificativas mascaradas, nenhum termo do dicionário nem do autor
      const tudo = await page.locator('.quiz-options').textContent();
      expect(termosNoTexto(tudo ?? '')).toEqual([]);
      expect(await page.locator('.quiz-verso').textContent()).not.toMatch(/Plano_Original|\.md\b/);
      if (i % 5 === 0) expect(await estouro(page)).toBe(0);
      await page.getByRole('button', { name: /Próxima pergunta|Ver resultado/ }).click();
    }

    // Resultado: o painel "Ver voto a voto" mostra o original, com os termos do dicionário
    await expect(page.locator('h2')).toContainText('Seu Resultado');
    expect(await estouro(page)).toBe(0);
    await page.getByRole('button', { name: 'Ver voto a voto' }).click();
    const painel = page.locator('.ui-slide-panel');
    await expect(painel).toHaveClass(/open/);
    await expect(painel.locator('.res-revelacao-voto')).toHaveCount(15);
    const textoPainel = (await painel.textContent()) ?? '';
    expect(norm(textoPainel).length).toBeGreaterThan(1000);
    for (const id of escolhidos) {
      const literal = trechosQuiz.find((t) => t.id === id)!.texto_literal;
      expect(norm(textoPainel), `literal de ${id}`).toContain(norm(literal));
    }
    const noPainel = termosNoTexto(textoPainel).filter((t) => t !== 'identificador direto');
    expect(noPainel.length, 'o painel traz termos do dicionário em texto original').toBeGreaterThan(0);
    expect(textoPainel).not.toMatch(/\[programa federal|\[sistema nacional|\[polícia municipal/);
    expect(await estouro(page)).toBe(0);
    await page.keyboard.press('Escape');

    expect(erros).toEqual([]);
  });
}
