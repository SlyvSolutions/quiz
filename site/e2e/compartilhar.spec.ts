import { test, expect, type Page } from '@playwright/test';

/** Sessão pronta no armazenamento local, para abrir direto na tela Compartilhar. */
async function abrirCompartilhar(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem(
      'mq.sessao.v1',
      JSON.stringify({
        versao: 1,
        ordemCandidatos: ['plano-a', 'plano-b', 'plano-c', 'plano-d', 'plano-e'],
        revelacaoVista: true,
        perguntasQuiz: [{ id: 's1' }, { id: 's2' }, { id: 's3' }],
        respostasQuiz: { s1: 'lula-seguranca', s2: 'renan-economia', s3: 'flavio-seguranca' },
        finalizado: true,
      })
    );
  });
  await page.goto('/quiz/#compartilhar');
  await expect(page.locator('.comp-print-area')).toBeVisible();
}

test.describe('Compartilhar o resultado', () => {
  test('com suporte do navegador, Compartilhar entrega a imagem PNG e o texto à folha de compartilhamento', async ({ page }) => {
    await page.addInitScript(() => {
      const w = window as unknown as { __envio?: { nome: string; tipo: string; tamanho: number; texto: string; largura: number } };
      Object.defineProperty(navigator, 'canShare', { value: () => true, configurable: true });
      Object.defineProperty(navigator, 'share', {
        configurable: true,
        value: async (dados: { files: File[]; text: string }) => {
          const f = dados.files[0]!;
          const bmp = await createImageBitmap(f);
          w.__envio = { nome: f.name, tipo: f.type, tamanho: f.size, texto: dados.text, largura: bmp.width };
        },
      });
    });
    await abrirCompartilhar(page);
    await page.getByRole('button', { name: 'Compartilhar', exact: true }).click();
    await expect(page.locator('.comp-status')).toContainText('compartilhado');
    const envio = await page.evaluate(() => (window as unknown as { __envio: { nome: string; tipo: string; tamanho: number; texto: string; largura: number } }).__envio);
    expect(envio.nome).toBe('meu-resultado.png');
    expect(envio.tipo).toBe('image/png');
    expect(envio.tamanho).toBeGreaterThan(5000);
    expect(envio.largura).toBe(1080);
    expect(envio.texto).toContain('https://slyvsolutions.github.io/quiz/');
    expect(envio.texto).not.toMatch(/Miss[aã]o/);
  });

  test('sem suporte a compartilhar arquivo, só há Baixar imagem e ele baixa um PNG', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
      Object.defineProperty(navigator, 'canShare', { value: undefined, configurable: true });
    });
    await abrirCompartilhar(page);
    await expect(page.getByRole('button', { name: 'Compartilhar', exact: true })).toHaveCount(0);
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Baixar imagem' }).click(),
    ]);
    expect(download.suggestedFilename()).toBe('meu-resultado.png');
    await expect(page.locator('.comp-status')).toContainText('baixada');
  });

  test('fechar a folha de compartilhamento não é erro', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'canShare', { value: () => true, configurable: true });
      Object.defineProperty(navigator, 'share', {
        configurable: true,
        value: async () => {
          throw Object.assign(new Error('cancelado'), { name: 'AbortError' });
        },
      });
    });
    await abrirCompartilhar(page);
    await page.getByRole('button', { name: 'Compartilhar', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Compartilhar', exact: true })).toBeEnabled();
    await expect(page.locator('.comp-status')).not.toContainText('Não foi possível');
  });
});
