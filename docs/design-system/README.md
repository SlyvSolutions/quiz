Sistema visual do Missão (14): amarelo, dourado, preto e branco, Helvetica Neue em peso 900 e caixa alta, e a onça-pintada como símbolo. É o sistema do site da campanha (renanpresidente.com.br) com o movimento do Livro Amarelo: direto, gigante, de campanha.

## Tom de voz

- Frases curtas, afirmativas e com energia. Assinatura: **"O futuro é glorioso"**.
- Fale com "você". O partido fala na primeira pessoa do plural ("a Missão", "nós").
- Chamadas de ação no imperativo, curtas e em CAIXA ALTA: "VOU VOTAR 14", "FAÇA SUA COLINHA", "AJUDE NA CAMPANHA", "GERAR MEU LINK".
- Sempre dê uma saída para quem hesita, como o site faz: ao lado do "VOU VOTAR 14" vem "AINDA NÃO ESTOU CONVENCIDO".
- Urgência concreta: "FALTAM 6 DIAS", a data da eleição (4 de outubro), o número **14** sempre que a peça pedir voto.
- Sem emoji em peça oficial.

## Cor

- Dois amarelos com papéis diferentes. `amarelo` (#FCBE26) é superfície e CTA: fundo de card de destaque, texto de botão sobre preto, a segunda linha dos títulos gigantes sobre preto. `ouro` (#D4A017) é acento: botão pequeno de nav, eyebrow e ícone sobre fundo escuro.
- Texto dourado sobre fundo claro é sempre `ouro-escuro`. Nunca `amarelo` ou `ouro` como texto sobre branco.
- Dois pretos: `preto` (#000) para fundos; `tinta` (#0A0A0A) para texto e botões.
- Fundos: `surface` (branco no claro, preto no escuro) e `surface-raised` (papel #F7F5F1 no claro, #111 no escuro). Um brilho amarelo desfocado num canto do fundo claro é permitido (é marca do /vou-votar e do /doar).
- Interface: `ink` sobre `surface`; `ink-muted` para apoio; `line` para bordas de card e divisórias; `erro` com ícone e frase para erros de formulário.
- Foco: `focus`, 2px, sólido. Nunca remova o foco sem trocá-lo por uma borda `focus`.

## Tipografia

- Uma família de interface, `sans` (Helvetica Neue do sistema, sem webfont).
- Todo título (`display`, `h1`, `h2`, `h3`) é peso 900, CAIXA ALTA, espaçamento −0,01em e entrelinha 0,9–0,95. Hierarquia é tamanho, não peso.
- Acima de cada título, um `eyebrow`: 11px, CAIXA ALTA, espaçamento 0,3em, `ouro-escuro` no claro e `ouro` no escuro.
- Corpo em `body` (18px), apoio em `small`; botões em `button` (CAIXA ALTA, 0,2em); rótulos de campo em `label`; menu em `nav`.
- A serifa `glorioso` (Cormorant Garamond 300) existe para uma frase só: "O futuro é glorioso".
- O 14 pode aparecer gigante ou em "teclas de urna": dois cartões pretos `radius-lg` com os dígitos em `amarelo`.

## Espaço e forma

- Margem lateral `space-5` no celular e `space-10` no desktop; seções abrem com `space-14`/`space-20`; conteúdo até `container`.
- Raios por função: `radius-pill` nos CTAs principais e chips; `radius-xl` em cards, menus e modais; `radius-lg` em botões dentro de cards e opções; `radius-md` em inputs e envio de formulário; `radius-sm` só no botão dourado pequeno de nav.
- Botão primário: pill `tinta` com texto `amarelo`, até `cta-max` de largura; o CTA principal da tela pode ter 96px de altura. Secundário: pill branco com borda 1px `tinta` a 30%. Hover: escala 1.03 em 150ms.
- Card claro: `radius-xl`, borda `line`, `shadow-card`; no hover sobe 2px. Card de destaque: borda 2px preta e `shadow-offset` (bloco amarelo atrás).
- Sombras só as quatro do sistema. Degradê só nos brilhos descritos em **Site e movimento**.

## Movimento

- Todo site e todo quiz do Missão seguem a seção **Site e movimento**: portal com íris, revelação por rolagem, títulos gigantes contra rótulos minúsculos espaçados, claro e escuro por tela, e nada se move sem motivo.

## Logos

- Use apenas os arquivos oficiais do grupo **Logos**. Nunca redesenhe, recorte, recolora ou distorça a onça ou o nome.
- A assinatura principal é vertical: "missão" em minúsculas, girado 90°, à esquerda da cabeça da onça em `amarelo`, `preto`, `branco` e `cinza-onca`.
- Em fundo claro (`surface` claro, `branco`), use `missao-logo-vertical-texto-preto.svg`. Em fundo escuro (`preto`, `surface` escuro), use `missao-logo-vertical-fundo-preto.svg`.
- Não aplique a logo colorida sobre `amarelo`: a onça some. Sobre amarelo, use só o nome "missão" em `preto`.
- `missao-bandeira.svg` é a bandeira do partido: três faixas horizontais iguais, `preto`, `branco` e `amarelo`, com "missão" em preto na faixa branca. Use as faixas como motivo gráfico em capas e cabeçalhos.
- Deixe em volta da logo um respiro de pelo menos a largura da letra "m".
