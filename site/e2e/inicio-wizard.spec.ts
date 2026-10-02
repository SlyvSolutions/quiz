import { test, expect } from '@playwright/test';

test('wizard: 5 slides, pular e CTA levam ao teste cego', async ({ page }) => {
  await page.goto('/quiz/#inicio');
  await expect(page.getByRole('region', { name: /apresentação/i })).toBeVisible();
  await expect(page.getByText(/A PROPOSTA ANTES DA NARRATIVA/)).toBeVisible();
  // sem scroll de página: deck ocupa a viewport
  expect(await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight + 1)).toBe(true);
  await page.getByRole('button', { name: /próximo slide/i }).click();
  await expect(page.getByText(/DO TESTE AO RESULTADO/)).toBeVisible();
  await page.getByRole('button', { name: /pular introdução/i }).click();
  await expect(page.getByText(/Teste Cego/)).toBeVisible();
});
