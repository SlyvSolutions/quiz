# Como as avaliações são feitas

Este documento explica como cada trecho dos planos de governo recebe os vereditos dos 5 critérios. Quem ler isto e os planos originais (`Planos_TSE/`) deve chegar a vereditos comparáveis.

**Regras que valem sempre** (definidas em `site/public/data/criterios.json`):

- Os mesmos 5 critérios e a mesma escala de 6 níveis valem para os cinco candidatos, incluindo o do Partido Missão.
- Toda avaliação tem justificativa e fonte. Sem fonte, o veredito é "Sem base para avaliar".
- "Difícil" e "Inviável nos termos propostos" só valem com norma ou dado público citado.
- A ferramenta nunca recomenda voto.

## 1. Princípio

Um trecho isolado engana. Um plano de governo diz numa página o que promete e noutra de onde vem o dinheiro, em que prazo e com qual lei. Por isso quem avalia um trecho já leu o plano inteiro, com os cinco critérios em mente desde a primeira página, e avalia o trecho no contexto do plano, não só do parágrafo.

## 2. O avaliador: defensor honesto

Cada plano é avaliado por um avaliador que age como defensor ferrenho do plano, mas honesto:

- **Ferrenho:** procura a melhor leitura legítima do plano. Se a fonte de recurso está em outro capítulo, acha e cita. Se o prazo aparece num quadro no fim, acha e cita. Não avalia pelo pior sentido possível e não se contenta com "não disse" sem procurar no documento todo.
- **Honesto:** quando a defesa não se sustenta, admite. Conta que não fecha, prazo que não cabe no mandato, norma que exige quórum que o plano ignora: tudo isso entra no veredito, sem suavizar.
- **Igual para os cinco:** o mesmo papel, o mesmo rigor e as mesmas perguntas. Nem favor, nem rigor extra.
- A defesa é ferramenta de leitura. Não é publicada nem escolhe lado na eleição.

## 3. Etapas

### Etapa A: dossiê do plano (uma vez por candidato)

1. Ler o plano original inteiro (`Planos_TSE/<Candidato>_Plano_Original*.md`). Para o Cury há duas partes; as avaliações citam as duas.
2. Montar o dossiê: todas as propostas que envolvam recurso, norma ou prazo, cada uma com arquivo e linhas:
   - o que promete, em uma frase;
   - custo ou efeito financeiro declarado, com a conta em passos visíveis, separando o que o plano declara do que o avaliador calculou;
   - fonte de recurso declarada (e onde);
   - instrumento e norma necessários (lei ordinária, complementar, PEC, decreto), com o artigo citado;
   - quem decide (Executivo, Congresso, STF, estados e municípios);
   - prazo declarado (e onde);
   - experiência comparável conhecida, com fonte pública.
3. Fechar com o balanço do plano: o que o plano diz gastar, o que diz economizar ou arrecadar, e se o conjunto se sustenta nos próprios números do plano. Se a conta não fecha com o que está escrito, dizer isso.

O dossiê é material de trabalho e não está neste repositório. O que está publicado são os vereditos, as justificativas e as fontes.

### Etapa B: avaliação por trecho

Para cada trecho e cada critério (C1 a C5), nesta ordem:

1. **Defesa:** a melhor leitura legítima, com arquivo e linhas do plano (inclusive de outros capítulos).
2. **Limite admitido:** onde a defesa falha (conta que não fecha, norma mais exigente, prazo curto, evidência contrária). Se não houver, dizer "nenhum limite encontrado" e por quê.
3. **Veredito** na escala de `criterios.json`, aplicando a frase do nível correspondente ao critério.
4. **Justificativa publicável:** 1 a 3 frases neutras, sem adjetivo, sem recomendar voto, com a fonte (plano por arquivo e linhas; norma ou dado público por citação).

Regras de decisão:

- Sem fonte, "Sem base para avaliar". Vale também para a defesa: não se inventa fonte para sustentar o plano.
- Quando a defesa e o limite apontam para níveis diferentes, vale o nível que o limite admitido sustenta com fonte. A defesa só sobe o veredito se trouxer trecho do plano que resolva a lacuna.
- C1 e C5 leem o plano. C2, C3 e C4 exigem norma e dados externos, com o dispositivo exato (Constituição, lei, regimento) ou a fonte oficial.
- O mesmo padrão recebe o mesmo veredito para qualquer candidato.

### Etapa C: autoteste

Antes de entregar, para cada veredito que não seja "Sem base para avaliar": "o que me faria mudar este veredito?" e "eu daria o mesmo veredito se este texto fosse de outro candidato?". Se a resposta à segunda for "não", corrigir.

### Etapa D: calibração cruzada

Um segundo avaliador, sem contexto, recebe só os trechos anônimos (com a máscara de autor) e a régua, e emite vereditos independentes. As divergências vão para uma lista com os dois argumentos. Padrões iguais com vereditos diferentes entre candidatos são tratados como erro de régua e corrigidos dos dois lados.

### Etapa E: aprovação humana

Nenhuma IA aprova o resultado. Uma pessoa revisa a lista de divergências, os vereditos "Difícil" e "Inviável" e uma amostra dos demais, e aprova por escrito.

## 4. O que é publicado

`site/public/data/avaliacoes.json` e `avaliacoes_quiz.json` trazem, por critério e trecho: `criterio_id`, `trecho_id`, `veredito`, `justificativa` e `fonte` (e, no programa, o `outro_lado`). A defesa e o limite admitido ficam no material de trabalho.

## 5. Riscos conhecidos e mitigação

| Risco | Mitigação |
|---|---|
| A persona de defensor inflar vereditos | Sem fonte, sem base; o limite admitido é obrigatório; calibração cruzada |
| Rigor desigual entre candidatos | Mesmo avaliador-tipo e mesmo roteiro para os cinco; autoteste; revisão humana |
| Conta financeira com premissa arbitrária | Separar "declarado pelo plano" de "calculado"; mostrar os passos; se faltar base no plano, "Sem base para avaliar" |
| Citação de norma errada | Toda norma citada com dispositivo exato e conferida por quem revisa |
| Trecho literal alterado | O texto vem do `.md` original com arquivo e linhas, e o build confere |
| Publicar o argumento de defesa como posição da ferramenta | Só a justificativa neutra é publicada |

## 6. Convenções

- **A aprovação anual do orçamento (LOA) não rebaixa nível.** É pano de fundo, não dependência que conte para o C3. Vale igual para os cinco.
- **Decisão de ente autônomo.** Quando a norma reserva a decisão a ente autônomo sem votação (por exemplo, a Selic é privativa do Banco Central, LC 179/2021, art. 2º), a escala não tem nível próprio: usa-se "Parcial" por analogia, com a justificativa citando o dispositivo.
- **Direitos políticos.** Com condenação transitada em julgado, a suspensão cabe por lei ordinária (CF art. 15, III; STF Tema 370). Sem condenação, exige emenda constitucional.
- **Norma vigente misturada com norma nova.** Quando parte da proposta cabe na lei vigente e parte exige mudança, o nível é "Parcial". "Difícil" vale só quando toda a proposta, ou a sua parte central, exige lei complementar ou emenda, com a norma conferida.
- **C4 só com fonte aberta e conferida.** Resultado medido em contexto comparável é "Viável"; em contexto diferente, com a diferença nomeada, "Viável com condições"; evidência mista ou só de parte do objetivo, "Parcial"; "Difícil" e "Inviável" exigem resultado fraco ou falha documentados em fonte aberta. Notícia, blog e documento de terceiros são só pista. Sem fonte conferida, o veredito é "Sem base para avaliar", com o texto "Esta versão não traz experiência documentada com fonte conferida para este trecho."
- **Desempate.** Se dois avaliadores independentes concordam, o veredito está resolvido. Se discordam, vale o que o texto do trecho diz mais a norma aberta em fonte oficial, no nível da frase correspondente em `criterios.json`.
