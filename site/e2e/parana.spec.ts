import { test, expect } from '@playwright/test';

// Guarda contra "sumiram os candidatos": a tela do Paraná precisa listar a base inteira, sem erro de console.
for (const [largura, altura] of [[360, 640], [1280, 800]] as const) {
  test(`Paraná lista os 66 candidatos sem erro (${largura}x${altura})`, async ({ page }) => {
    const erros: string[] = [];
    page.on('console', (m) => { if (m.type() === 'error') erros.push(m.text()); });
    page.on('pageerror', (e) => erros.push(e.message));
    await page.setViewportSize({ width: largura, height: altura });
    await page.goto('/quiz/#parana');
    await expect(page.getByText('66 candidatos')).toBeVisible();
    await expect(page.locator('article')).toHaveCount(66);
    const estouro = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(estouro).toBeLessThanOrEqual(0);
    expect(erros).toEqual([]);
  });
}
