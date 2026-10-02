# Missão Quiz

Quiz que compara as propostas dos cinco candidatos à Presidência em 2026 com a mesma régua para todos, incluindo o candidato do Partido Missão.

Feito com o SDM Sled-Development-Method, pela SlyvSolutions. Contato: (41) 99946-7052.

Site: https://slyvsolutions.github.io/quiz/

## Como funciona

Cada trecho dos planos de governo passa por 5 critérios (fonte de recurso, exigência legal, dependência do Congresso, precedente e prazo). O site mostra:

- **O veredito de cada critério**, com justificativa e fonte.
- **Concretude**: quantos dos 5 critérios deu para avaliar com fonte ("N de 5"). Não mede se a ideia é boa nem se vai dar certo.
- **No Resultado**, a concretude média dos planos de cada candidato e um modal com as propostas dele. A lista segue a afinidade do eleitor, não a concretude.

"Sem base para avaliar" quer dizer que não foi possível sustentar um nível com fonte; não conta como avaliado.

## O que há aqui

| O quê | Onde |
|---|---|
| Critérios e escala | `site/public/data/criterios.json` |
| Como as avaliações são feitas | `docs/metodologia-avaliacao-criterios.md` |
| Vereditos, justificativas e fontes | `site/public/data/avaliacoes*.json`, `docs/avaliacao/final/` |
| Trechos usados e sua origem (arquivo e linha) | `site/public/data/trechos*.json`, `docs/avaliacao/novos-trechos/` |
| Planos de governo originais | `Planos_TSE/` |
| Cálculo da concretude | `site/src/core/cobertura.ts`, `site/src/core/concretude.ts` |
| Hashes dos dados publicados | `site/public/manifesto.json` |
| Design system | `docs/design-system/` |

## Rodar e testar

```
cd site
npm ci
npm test              # testes unitários e de telas
npm run build         # verifica trechos literais, máscaras, anonimato e regras do projeto, depois gera dist/
npx playwright test   # fluxo completo no navegador
```

O build reprova trecho que não seja literal ao plano e arquivo versionado com nome pessoal.
