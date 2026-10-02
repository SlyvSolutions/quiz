import { test, expect, type Page } from '@playwright/test';

/** Do wizard do Início até a primeira pergunta do quiz (pula a apresentação, ordena os 5 planos, avança a revelação). */
async function ateOQuiz(page: Page) {
  await page.getByRole('button', { name: /pular introdução/i }).click();
  await expect(page.locator('button', { hasText: 'Escolher' })).toHaveCount(5);
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
  await page.getByRole('button', { name: /AVANÇAR PARA O QUIZ/i }).click({ force: true });
  await expect(page.locator('.quiz-question')).toBeVisible();
}

/** Total de perguntas do quiz, lido do "Passo N de T" da tela. */
async function totalDoQuiz(page: Page): Promise<number> {
  const texto = (await page.locator('.quiz-step-text').textContent()) ?? '';
  return Number(/de (\d+)/.exec(texto)?.[1]);
}

/** Vota na 1ª opção das `n` perguntas seguintes e devolve os enunciados vistos. */
async function votar(page: Page, n: number): Promise<string[]> {
  const enunciados: string[] = [];
  for (let i = 0; i < n; i++) {
    await expect(page.locator('.quiz-question')).toBeVisible();
    enunciados.push((await page.locator('.quiz-question').textContent()) ?? '');
    await page.locator('.quiz-option-content').first().click();
    await page.getByRole('button', { name: /Próxima pergunta|Ver resultado/ }).click();
  }
  return enunciados;
}

test.describe('Missão Quiz - Fluxos Completos e Edge Cases', () => {
  // Os fluxos de 15 perguntas levam cerca de 40 s; sob carga (2 workers) o limite de 90 s ficava justo
  test.describe.configure({ timeout: 150_000 });

  test('Vitória Limpa (Alinhamento Total)', async ({ page }) => {
    // 1. Início (wizard): pula a apresentação e começa o teste cego
    await page.goto('/quiz/');
    await expect(page.getByText(/A PROPOSTA ANTES DA NARRATIVA/)).toBeVisible();
    await page.getByRole('button', { name: /pular introdução/i }).click();
    
    // 2. Teste Cego (a íris leva ~1s: heading único espera a troca terminar)
    await expect(page.getByRole('heading', { name: /Teste Cego/i })).toBeVisible();
    
    // Testa a abertura do Slide-Panel (Resumo do Plano)
    const btnResumoTC = page.locator('.tc-card').first().locator('.btn-resumo');
    await btnResumoTC.click();
    
    // Verifica se o painel abre e tem conteúdo
    const slidePanel = page.locator('.ui-slide-panel');
    await expect(slidePanel).toHaveClass(/open/);
    await expect(slidePanel.locator('h3')).toBeVisible();
    
    // Fecha o painel (clicando no botão X)
    await page.locator('.ui-slide-close').click();
    await expect(slidePanel).not.toHaveClass(/open/);

    await expect(page.locator('button', { hasText: 'Escolher' })).toHaveCount(5);
    for (let i = 0; i < 5; i++) {
      const botoes = page.locator('button', { hasText: 'Escolher' });
      await botoes.first().click();
      await expect(botoes).toHaveCount(4 - i);
    }

    const btnPronto = page.getByRole('button', { name: /PRONTO/i });
    await expect(btnPronto).toBeEnabled();
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('PRONTO'));
      if (btn) btn.click();
    });

    // 3. Revelação
    await expect(page.locator('h2')).toContainText('A Grande Revelação');
    await page.getByRole('button', { name: /AVANÇAR PARA O QUIZ/i }).click({ force: true });

    // Para simplificar no E2E sem injetar dados mock, vamos sempre clicar na 1ª opção
    const total = await totalDoQuiz(page);
    expect(total).toBe(15);
    for (let i = 0; i < total; i++) {
      await expect(page.locator('.quiz-question')).toBeVisible();
      
      // Vota na primeira opção
      await page.locator('.quiz-option-content').first().click();
      await expect(page.getByRole('button', { name: /Próxima pergunta|Ver resultado/ })).toBeVisible();
      await page.getByRole('button', { name: /Próxima pergunta|Ver resultado/ }).click();
    }

    // 5. Resultado
    await expect(page.locator('h2')).toContainText('Seu Resultado');
    
    // Pelo menos 1 card no ranking
    expect(await page.locator('.res-card').count()).toBeGreaterThan(0);
    
    // O primeiro lugar deve ter a badge de destaque (Alta afinidade ou Empate)
    await expect(page.locator('.res-card.destaque').first()).toBeVisible();

    // O ranking não traz selos de força; o voto a voto abre num painel com os 15 votos e fecha com Esc
    await expect(page.locator('.res-card .selo-concretude')).toHaveCount(0);
    await page.getByRole('button', { name: 'Ver voto a voto' }).click();
    const painel = page.locator('.ui-slide-panel');
    await expect(painel).toHaveClass(/open/);
    await expect(painel.locator('.res-revelacao-voto')).toHaveCount(15);
    await expect(painel.locator('.concretude-bloco').first()).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(painel).toHaveCount(0);
  });

  test('Empate Técnico no Quiz', async ({ page }) => {
    // 1. Início (wizard): pula a apresentação e começa o teste cego
    await page.goto('/quiz/');
    await expect(page.getByText(/A PROPOSTA ANTES DA NARRATIVA/)).toBeVisible();
    await page.getByRole('button', { name: /pular introdução/i }).click();
    
    // 2. Teste Cego
    // Organiza todos clicando em Escolher
    await expect(page.locator('button', { hasText: 'Escolher' })).toHaveCount(5);
    for (let i = 0; i < 5; i++) {
      const botoes = page.locator('button', { hasText: 'Escolher' });
      await botoes.first().click();
      await expect(botoes).toHaveCount(4 - i);
    }
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('PRONTO'));
      if (btn) btn.click();
    });

    // 3. Revelação
    await expect(page.locator('h2')).toContainText('A Grande Revelação');
    await page.getByRole('button', { name: /AVANÇAR PARA O QUIZ/i }).click({ force: true });

    // 4. Quiz (alterna a opção 1 e a opção 2)
    const total = await totalDoQuiz(page);
    for (let i = 0; i < total; i++) {
      await expect(page.locator('.quiz-question')).toBeVisible();
      // Alterna o clique entre a opção 1 e a opção 2 para simular votos divididos (potencial empate)
      if (i % 2 === 0) {
        await page.locator('.quiz-option-content').nth(0).click();
      } else {
        await page.locator('.quiz-option-content').nth(1).click();
      }
      await page.getByRole('button', { name: /Próxima pergunta|Ver resultado/ }).click();
    }

    // 5. Resultado
    await expect(page.locator('h2')).toContainText('Seu Resultado');
    
    // Como alternamos entre duas opções diferentes, a chance de empate no topo é alta.
    // Vamos garantir que a tela renderiza o ranking corretamente sem quebrar
    expect(await page.locator('.res-card').count()).toBeGreaterThan(0);
  });

  test('Teste cego: F5 mantém a ordem dos cards; refazer a jornada sorteia de novo', async ({ page }) => {
    test.setTimeout(120_000);
    const ordem = () => page.locator('.tc-list:not(.ranked-list) .tc-card').evaluateAll((cs) => cs.map((c) => (c as HTMLElement).dataset.id ?? ''));
    const abrir = async () => {
      await page.evaluate(() => {
        window.location.hash = '#inicio';
      });
      await page.getByRole('button', { name: /pular introdução/i }).click();
      await expect(page.locator('button', { hasText: 'Escolher' })).toHaveCount(5);
    };

    await page.goto('/quiz/');
    await abrir();
    const primeira = await ordem();
    expect(new Set(primeira).size).toBe(5);

    // F5: mesma ordem
    await page.reload();
    await expect(page.locator('button', { hasText: 'Escolher' })).toHaveCount(5);
    expect(await ordem()).toEqual(primeira);

    // Refazer a jornada sorteia de novo: com 120 ordens possíveis, 8 refações iguais à primeira têm chance ~ (1/120)^8
    const vistas = new Set<string>([primeira.join('|')]);
    for (let i = 0; i < 8; i++) {
      await abrir();
      vistas.add((await ordem()).join('|'));
    }
    expect(vistas.size).toBeGreaterThan(1);
  });

  test('F5 no meio do quiz mantém o quiz; terminar e refazer a jornada sorteia outro quiz com os mesmos 15 subtemas em outra ordem', async ({ page }) => {
    test.setTimeout(240_000); // duas jornadas completas
    await page.goto('/quiz/');
    await ateOQuiz(page);
    const primeiro = await votar(page, 3);

    // F5 no meio: mesma pergunta, mesmas opções, mesma ordem
    const opcoes = () => page.locator('.quiz-option-content').allTextContents();
    await expect(page.locator('.quiz-question')).toBeVisible();
    const antesEnunciado = await page.locator('.quiz-question').textContent();
    const antesOpcoes = await opcoes();
    await page.reload();
    await expect(page.locator('.quiz-question')).toHaveText(antesEnunciado ?? '');
    expect(await opcoes()).toEqual(antesOpcoes);
    await expect(page.locator('.quiz-step-text')).toContainText('Passo 4 de 15');

    // termina o quiz
    const resto = await votar(page, 12);
    const quizUm = [...primeiro, ...resto];
    await expect(page.locator('h2')).toContainText('Seu Resultado');

    // volta ao início e refaz: sorteio novo
    await page.evaluate(() => {
      window.location.hash = '#inicio';
    });
    await ateOQuiz(page);
    const quizDois = await votar(page, 15);
    await expect(page.locator('h2')).toContainText('Seu Resultado');

    // todos os 15 subtemas entram em toda sessão; o sorteio só muda a ordem
    expect(new Set(quizUm).size).toBe(15);
    expect(new Set(quizDois)).toEqual(new Set(quizUm));
    expect(quizDois.join('|')).not.toBe(quizUm.join('|'));
  });

  test('sessão antiga de 10 perguntas guardada no navegador é sorteada de novo: o quiz abre com 15', async ({ page }) => {
    await page.goto('/quiz/');
    // Sessão de 10 perguntas com ids de trecho reais: só o conjunto de subtemas a torna antiga
    await page.evaluate(async () => {
      const subtemas: { id: string; eixo: string; enunciado: string }[] = await (await fetch('/quiz/data/subtemas.json')).json();
      const trechos: { id: string; subtema_id: string }[] = await (await fetch('/quiz/data/trechos_quiz.json')).json();
      const eixos = ['Segurança', 'Economia', 'Educação', 'Reformas', 'Saúde'];
      const perguntasQuiz = eixos.flatMap((e) =>
        subtemas
          .filter((s) => s.eixo === e)
          .slice(0, 2)
          .map((s) => ({
            id: s.id,
            eixo: e,
            subtema_id: s.id,
            enunciado: 'Antiga?',
            opcoes: trechos.filter((t) => t.subtema_id === s.id).slice(0, 3).map((t) => t.id),
          }))
      );
      localStorage.setItem(
        'mq.sessao.v1',
        JSON.stringify({
          versao: 1,
          ordemCandidatos: ['lula', 'flavio', 'cury', 'caiado', 'renan'],
          respostasQuiz: {},
          finalizado: false,
          revelacaoVista: true,
          perguntasQuiz,
        })
      );
    });
    await page.goto('/quiz/#quiz');
    await page.reload();
    await expect(page.locator('.quiz-question')).toBeVisible();
    expect(await totalDoQuiz(page)).toBe(15);
    await expect(page.locator('.quiz-question')).not.toHaveText('Antiga?');
  });

  test('Depois do voto o card escolhido vira e mostra os 5 critérios no verso preto', async ({ page }) => {
    await page.goto('/quiz/');
    await ateOQuiz(page);
    await page.locator('.quiz-option-content').nth(1).click();
    const flip = page.locator('.quiz-option-card.selecionada .quiz-flip');
    await expect(flip).toHaveClass(/virado/);
    const verso = flip.locator('.quiz-verso');
    await expect(verso.locator('.slide-criterios-item')).toHaveCount(5);
    // o trecho sorteado pode ter 0 critérios avaliados: então a nota é 1,0 (v2: Sem base vale 1)
    await expect(verso.locator('.concretude-bloco')).toBeVisible();
    await expect(verso.locator('.selo-concretude')).toContainText(/CONCRETUDE \d de 5/);
    await expect(verso).toBeFocused();
    expect(await verso.evaluate((n) => getComputedStyle(n).backgroundColor)).toBe('rgb(0, 0, 0)');
    // não sobra slide abaixo das opções
    await expect(page.locator('.slide-criterios')).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'Próxima pergunta' })).toBeVisible();
  });

  test('Movimento reduzido: o card troca para o verso sem giro', async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto('/quiz/');
    await ateOQuiz(page);
    await page.locator('.quiz-option-content').first().click();
    const giro = page.locator('.quiz-flip.virado .quiz-flip-giro');
    await expect(giro).toBeVisible();
    expect(await giro.evaluate((n) => getComputedStyle(n).transform)).toBe('none');
    await expect(page.locator('.quiz-verso')).toBeVisible();
    await expect(page.locator('.selecionada .quiz-frente')).toBeHidden();
    await ctx.close();
  });

  test('Rodapé Global Links', async ({ page }) => {
    // O rodapé sai de cena na inicio (wizard fullscreen): valida no método
    await page.goto('/quiz/#metodo');

    const footer = page.locator('.app-footer-links');
    // O Comparador só abre no fim da jornada: no início aparece bloqueado, sem link
    const comparador = footer.getByText(/Comparador/i);
    await expect(comparador).toBeVisible();
    await expect(comparador).toHaveAttribute('aria-disabled', 'true');
    await expect(footer.getByRole('link', { name: /Comparador/i })).toHaveCount(0);
    await expect(footer.getByRole('link', { name: /Método/i })).toBeVisible();
    await expect(footer.getByRole('link', { name: /Candidatos PR/i })).toBeVisible();
  });
});
