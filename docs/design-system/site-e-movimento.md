# Site e movimento

Duas referências, medidas no código em 28/09/2026: o **Livro Amarelo** (livroamarelo.org.br) dá o movimento cinematográfico; o **site da campanha** (renanpresidente.com.br) dá a composição e a contenção. A regra que junta as duas: **telas de ação são quase paradas; telas de emoção se movem.** Perguntas, formulários e botões respondem rápido (150ms). Abertura e resultado ganham o movimento lento.

## Os gestos

Todo movimento é um destes. Não invente outros.

1. **Portal de entrada** (Livro Amarelo). Primeira tela escura (`preto`) com um objeto de marca que convida ao clique (a onça flutuando, ou o botão "COMEÇAR"). Ao clicar, o conteúdo abre em **íris circular** a partir do ponto do clique: dois círculos SVG em máscara, raio final = distância até o canto mais longe + 150px, **1300ms**, `easeInOutCubic`; o segundo começa 10% depois e o primeiro corre 12% mais rápido (borda dupla). O texto da entrada sai antes: opacidade 0, y −16px, blur 8px, **300ms**. O objeto flutua ±8px em 6s, com um anel pulsando no convite (opacidade .7→0, escala .9→1,35, 2,4s).
2. **Entrada de bloco.** Cada bloco entra uma vez: opacidade 0→1, y 22–26px→0, **900ms**, `cubic-bezier(.22,1,.36,1)` (ou GSAP `power2.out`), filhos em sequência a cada **120ms**. Dispara quando o topo do bloco passa 75% da tela. Na abertura e no resultado, some junto um blur 10px→0 (Livro Amarelo); nas telas de ação, sem blur e mais curto: y 14px→0 em **700ms** (a classe `entrar` do site da campanha).
3. **Frase presa** (site da campanha). "O FUTURO É GLORIOSO" em `glorioso`, sobre `preto`, numa seção de 180vh com o conteúdo preso (pin) e amarrado à rolagem (scrub 1): as linhas entram (opacidade + y 30) uma a uma, seguram, e saem (opacidade + y −20). "GLORIOSO" em `amarelo`. Uma vez por página, no fim.
4. **Resposta ao toque.** Botão pill: escala 1.03 em 150ms `cubic-bezier(.4,0,.2,1)`. Card: sobe 2px e ganha sombra em 150ms. Seta dentro do botão: anda 4px. Envio: spinner, `aria-busy`, texto "Confirmando…", no mínimo 900ms antes de seguir (dá peso ao gesto de votar).

Apoio (não são gestos, são chão):

- **Rolagem suave** com Lenis só nas páginas longas de narrativa: `duration: 1.2`, easing `1.001 − 2^(−10t)` (expo-out). Nunca nas telas do quiz.
- **Barra de progresso**: no scroll, fixa no topo, 2px `amarelo`; no quiz, barrinhas segmentadas ("Passo 2 de 7").
- **Contadores** sobem de 0 ao valor quando entram na tela; número em `display`, rótulo em `eyebrow`.
- **Faixa corrida** "FUTURO GLORIOSO ✦": 28s linear, infinita, uma por página.
- **Ponto pulsando** ao lado de urgência ("FALTAM 6 DIAS"): 2s, opacidade 1→.4, escala 1→.8.
- **Brilho** na palavra-chave dourada do fechamento: gradiente `amarelo`→`amarelo-claro`→`amarelo` em `background-clip: text`, 4,5s linear. Uma palavra por página.
- **Vídeo de fundo** do hero entra por cima de uma foto em meio-tom com fade de 700ms, só quando começa a tocar; pausa fora da tela.

## Composição

- **Tela de ação** (home, /vou-votar): uma tela, branco chapado, foto em meio-tom recortada com o vídeo por cima, título `display` com a 2ª palavra em dourado, CTA pill gigante (96px de altura, até 448px), CTA secundário branco embaixo, "VER MAIS" que abre um painel `surface-raised` com cards 2×/3×.
- **Página de narrativa** (/conheca, /brasil-2030, Livro Amarelo): claro e escuro em corte seco, seções altas, fotos P&B, títulos brancos gigantes, a frase presa no fim, rodapé preto com "FUTURO GLORIOSO" gigante em baixa opacidade.
- **Card de destaque**: borda 2px preta + `shadow-offset` (bloco `amarelo` atrás), ou card `amarelo` inteiro com texto `on-amarelo`.
- **Modal**: fundo preto a 70% com blur 8px; painel `radius-xl`, `shadow-modal`; no celular vira bottom-sheet (96dvh, só os cantos de cima arredondados). Fecha com Esc, clique fora e botão X; trava a rolagem do fundo; `role="dialog"` e `aria-modal="true"` sempre.

## No quiz

- **Início** = portal (gesto 1). A onça em fundo preto flutua; "COMEÇAR" abre em íris.
- **Pergunta** = tela de ação. Fundo `surface`, eyebrow "PERGUNTA 3 DE 10", pergunta em `h2`, opções como cards `radius-lg` com borda `line`; a escolhida ganha borda 2px `tinta` e `shadow-offset`. Entrada com gesto 2 curto (700ms, sem blur), saída em 300ms. Barrinhas segmentadas no topo, "Voltar" em pill outline e "Continuar" em pill primário, desabilitado até responder.
- **Resultado** = tela de emoção, em `preto`. Os candidatos em cards, o de maior afinidade no centro, maior, com `shadow-offset`; afinidade em contador; número do candidato em casinhas individuais (os dois primeiros dígitos, "14", em `amarelo`). Termina com a frase presa (gesto 3) e os botões "FAÇA SUA COLINHA" e compartilhar.
- **Colinha**: não refaça a lista de candidatos. O site da campanha abre `https://candidatos.missao.org.br/embed/colinha/modal?origem=<origem>&uf=<UF>` num modal (fecha por `postMessage({tipo:"colinha:fechar"})`). Use o mesmo, com `uf=PR`.
- **Formulário** (se houver): inputs `radius-md`, 46–48px de altura, borda 2px `tinta` a 15% que vira `focus` no foco; `label` acima; erro em `erro`, com ícone, embaixo do campo; máscara no telefone; campo-isca invisível contra robô.

## Movimento reduzido

Com `prefers-reduced-motion: reduce` (e com economia de dados ligada): sem Lenis, sem íris (vá direto ao conteúdo), sem blur, sem deslocamento, sem pin/scrub, sem flutuação, sem anel, sem faixa corrida, sem brilho, sem vídeo (fica a foto); contadores já no valor final. Só trocas de opacidade de até 150ms. Atenção: o site da campanha não protege as animações GSAP — o quiz protege todas.

## Implementação de referência

- Livro Amarelo: React + Vite + Tailwind, **framer-motion** (`whileInView`, `viewport: { once: true, margin: "-80px" }`, `staggerChildren`) e **Lenis** 1.1.
- Site da campanha: TanStack Start (React) + Tailwind v4 + shadcn, **GSAP + ScrollTrigger** (`from({opacity:0, y:26, duration:.9, stagger:.12, ease:"power2.out"})`, `start:"top 75%"`, pin com `scrub:1`) e **Lenis** 1.2, carregados só nas páginas de narrativa.
