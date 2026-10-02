import { criarIcone } from '../../ui/icone';
import { criarAviso, AVISO_AUTORIA } from '../../ui/aviso';
import { criarLogoGithub } from '../../ui/logo';
import { el, type Filho } from '../../ui/dom';
import { carregarJSON } from '../../data/carregar';
import { CriteriosSchema, type Criterios } from '../../data/tipos';
import { formatarDataPublicacao, niveisEmOrdem, numeroDaSecao } from './criterios';
import { ROTULOS_PROGRAMAS } from '../../core/rotulos-programas';

const URL_REPOSITORIO = 'https://github.com/SlyvSolutions/quiz';
const URL_DIVULGACAND = 'https://divulgacandcontas.tse.jus.br';

/* ---------- Peças de texto (tudo entra por el(), sempre como texto) ---------- */

function par(...filhos: Filho[]): HTMLElement {
  return el('p', {}, ...filhos);
}

function forte(texto: string): HTMLElement {
  return el('strong', { texto });
}

function cod(texto: string): HTMLElement {
  return el('code', { class: 'metodo-cod', texto });
}

function lista(...itens: Filho[][]): HTMLElement {
  return el('ul', { class: 'metodo-lista' }, ...itens.map((filhos) => el('li', {}, ...filhos)));
}

function passos(...itens: Filho[][]): HTMLElement {
  return el('ol', { class: 'metodo-passos' }, ...itens.map((filhos) => el('li', {}, ...filhos)));
}

function comando(texto: string): HTMLElement {
  return el('pre', { class: 'metodo-comando', attrs: { tabindex: '0' } }, el('code', { texto }));
}

function cartao(titulo: string, ...corpo: Filho[]): HTMLElement {
  return el('div', { class: 'metodo-cartao' }, el('h4', { texto: titulo }), ...corpo);
}

/** Bloco longo recolhido, com o mesmo visual do "Ver o parágrafo completo" do resto do site. */
function detalhes(rotulo: string, ...corpo: Filho[]): HTMLElement {
  return el(
    'details',
    { class: 'contexto metodo-detalhes' },
    el('summary', {}, criarIcone('busca'), rotulo, criarIcone('seta')),
    el('div', { class: 'contexto-corpo' }, ...corpo)
  );
}

function link(rotulo: string, href: string, classe = 'metodo-link'): HTMLElement {
  return el(
    'a',
    { class: classe, attrs: { href, target: '_blank', rel: 'noopener noreferrer' } },
    rotulo,
    criarIcone('seta')
  );
}

interface SecaoPronta {
  id: string;
  titulo: string;
  no: HTMLElement;
}

function secao(id: string, titulo: string, corpo: Filho[], classe = ''): SecaoPronta {
  const idDom = `metodo-${id}`;
  const no = el(
    'section',
    { class: `metodo-secao ${classe}`.trim(), attrs: { id: idDom, 'aria-labelledby': `${idDom}-titulo` } },
    el('h3', { texto: titulo, attrs: { id: `${idDom}-titulo`, tabindex: '-1' } }),
    ...corpo
  );
  return { id: idDom, titulo, no };
}

/* ---------- Seções ---------- */

function secaoVisaoGeral(): SecaoPronta {
  return secao('visao-geral', 'O que é esta ferramenta', [
    par(
      'O ',
      forte('Missão Quiz'),
      ' ajuda o eleitor a comparar, sem rótulo, os planos de governo oficiais dos cinco candidatos à Presidência: Lula, Flávio Bolsonaro, Augusto Cury, Ronaldo Caiado e Renan Santos. Você lê trechos dos planos sem saber de quem são, ordena, responde a um quiz de 15 perguntas, vê com quais planos mais concordou e só então abre o Comparador, onde os nomes aparecem.'
    ),
    el(
      'div',
      { class: 'grade metodo-duas' },
      cartao(
        'O que é',
        lista(
          ['Uma forma de ler as ideias antes de ver os nomes.'],
          ['Frases copiadas dos planos depositados no TSE, com arquivo e linha para você conferir.'],
          ['Código aberto: qualquer pessoa pode ver como tudo foi feito.']
        )
      ),
      cartao(
        'O que não é',
        lista(
          [forte('Não recomenda voto'), ' em nenhuma tela. O percentual de afinidade só mostra com quais trechos você concordou.'],
          ['Não é um resumo dos planos: cada candidato entra com poucas frases por assunto. Para decidir, leia o plano completo.'],
          ['Não guarda o que você responde em servidor, e não tem conta nem cadastro.']
        )
      )
    ),
    cartao(
      'Quem fez',
      par(AVISO_AUTORIA, '.'),
      par(
        'Um dos cinco candidatos, Renan Santos, é do Partido Missão. Por isso os mesmos critérios, a mesma escala e o mesmo tipo de trecho valem para os cinco, sem suavizar nenhum deles.'
      ),
      par(forte('Nada do que você responde sai do aparelho. '), 'Mais detalhes na seção de privacidade.')
    ),
  ]);
}

function secaoGithub(): SecaoPronta {
  return secao(
    'github',
    'Código aberto no GitHub',
    [
      el(
        'div',
        { class: 'metodo-gh-topo' },
        el('span', { class: 'metodo-gh-marca' }, criarLogoGithub()),
        el(
          'div',
          { class: 'pilha metodo-gh-texto' },
          par(
            'O código do site e o histórico de cada alteração (o git, que guarda quem mudou o quê e quando) ficam num repositório público. Qualquer pessoa pode ler, baixar e conferir, sem pedir licença a ninguém.'
          ),
          link('Abrir o repositório no GitHub', URL_REPOSITORIO, 'btn-pill btn-primaria metodo-cta')
        )
      ),
      el(
        'div',
        { class: 'pilha metodo-gh-corpo' },
        cartao(
          'O que você encontra lá',
          lista(
            ['O código-fonte do site e o histórico de versões.'],
            ['Os PDFs dos planos e as versões em texto, na pasta ', cod('Planos_TSE'), '.'],
            ['Os dados que o site usa, em ', cod('site/public/data'), '.'],
            ['Os scripts de verificação, em ', cod('site/scripts'), '.'],
            ['Os documentos de decisão do projeto, em ', cod('docs'), '.']
          )
        ),
        cartao(
          'Hash SHA-256: a impressão digital de um arquivo',
          par(
            'O hash é um código calculado a partir do conteúdo. Se um único caractere mudar, o código muda por completo. Por isso ele serve para provar que uma cópia não foi adulterada em relação ao que foi publicado. Ele não prova que o conteúdo está certo: para isso existem os PDFs do TSE.'
          ),
          par(
            forte('Situação hoje. '),
            'Cada trecho e cada parágrafo de contexto já têm o seu hash publicado em ',
            cod('trechos.json'),
            ' (campos ',
            cod('hash_texto'),
            ' e ',
            cod('hash_contexto'),
            '). O manifesto de hashes com SHA-256 de todos os arquivos da pasta pública (',
            cod('manifesto.json'),
            ') é gerado a cada build e publicado junto com o site.'
          )
        ),
        cartao(
          'Como conferir um hash, passo a passo',
          passos(
            ['Baixe o arquivo que quer conferir, do repositório ou do próprio site.'],
            ['Abra um terminal na pasta do arquivo e calcule o hash:', comando('sha256sum arquivo')],
            ['Compare o resultado com o hash publicado. Se forem idênticos, o arquivo é o mesmo. Se forem diferentes, ele foi alterado.']
          ),
          par('No Windows (PowerShell): ', cod('Get-FileHash arquivo -Algorithm SHA256'), '. No macOS: ', cod('shasum -a 256 arquivo'), '.'),
          par(
            forte('Para conferir um trecho: '),
            'abra ',
            cod('trechos.json'),
            ', copie o valor de ',
            cod('texto_literal'),
            ' e rode o comando abaixo no lugar do texto. O resultado deve ser igual ao ',
            cod('hash_texto'),
            ' do mesmo trecho.'
          ),
          comando('printf \'%s\' "texto copiado do trecho" | sha256sum')
        ),
        par(
          el('small', {
            class: 'metodo-nota',
            texto:
              'A marca do GitHub aparece apenas para identificar o repositório. Ela não indica apoio nem endosso do GitHub a este projeto. GitHub é marca de seus titulares.',
          })
        ),
      ),
    ],
    'metodo-github'
  );
}

function secaoTextos(): SecaoPronta {
  return secao('textos', 'De onde vêm os textos', [
    par(
      'Todo trecho vem dos planos de governo que cada candidatura depositou no TSE, disponíveis no Portal DivulgaCand. Os PDFs estão na pasta ',
      cod('Planos_TSE'),
      ' do repositório: um por candidato, e o de Augusto Cury vem em duas partes.'
    ),
    cartao(
      'Do PDF ao trecho publicado',
      passos(
        [forte('PDF oficial. '), 'É o documento depositado no TSE.'],
        [
          forte('Versão em texto. '),
          'Cada PDF tem uma cópia em texto (arquivo ',
          cod('.md'),
          ') extraída dele. É nessa cópia que o script procura as frases.',
        ],
        [
          forte('Frase escolhida. '),
          'A equipe escolheu as frases: uma por eixo para cada candidato no teste cego e no Comparador (25 trechos) e, no quiz, uma frase por candidato em cada subtema em que o plano traz uma proposta concreta. Não há critério automático de seleção. Os dados das avaliações estão no repositório, em docs/avaliacao/final.',
        ],
        [
          forte('Localização. '),
          'O script acha a frase no texto do plano, ignorando apenas diferenças de quebra de linha, espaços repetidos e hifenização de fim de linha. Maiúsculas, acentos e palavras precisam bater. Ele grava o arquivo, a linha inicial, a linha final e a página do PDF (a última numeração de página solta que aparece antes do trecho no texto extraído).',
        ],
        [
          forte('Regra do trecho literal. '),
          'Se o script não encontrar a frase no original, ele para com erro e o trecho não é publicado. Depois, um segundo script relê cada trecho publicado no arquivo original, nas linhas registradas, e falha se não o achar.',
        ]
      )
    ),
    par(
      'O texto literal é exatamente o que está no plano. A única alteração feita para o teste cego e o quiz é a máscara (nomes e identificadores por ',
      cod('[***]'),
      ' e nomes de programas por um rótulo neutro), como explicado na próxima seção. O texto original aparece sem máscara só no Resultado.'
    ),
    detalhes(
      'O que cada trecho registra',
      lista(
        [cod('candidato_id'), ' e ', cod('eixo'), ': de quem é e a qual dos cinco eixos pertence.'],
        [cod('arquivo'), ', ', cod('linha_inicio'), ' e ', cod('linha_fim'), ': onde está no texto do plano.'],
        [cod('pagina_pdf'), ': a página do PDF, para você abrir o original e ver a frase.'],
        [cod('texto_literal'), ' e ', cod('texto_mascarado'), ': a frase como está no plano e a versão do teste cego.'],
        [cod('hash_texto'), ': o SHA-256 do texto literal, para provar que ele não mudou.'],
        [cod('contexto_literal'), ', linhas do contexto e ', cod('hash_contexto'), ': o parágrafo em volta, com o mesmo tipo de registro.']
      )
    ),
    detalhes(
      'Arquivos dos planos no repositório',
      lista(
        [cod('Lula_Plano_Original.pdf'), ' e ', cod('.md')],
        [cod('Flavio_Plano_Original.pdf'), ' e ', cod('.md')],
        [cod('Caiado_Plano_Original.pdf'), ' e ', cod('.md')],
        [cod('Renan_Plano_Original.pdf'), ' e ', cod('.md')],
        [cod('Cury_Plano_Original1-2.pdf'), ', ', cod('Cury_Plano_Original2-2.pdf'), ' e os dois ', cod('.md'), ' correspondentes']
      )
    ),
    detalhes(
      'Quão fiel é a versão em texto ao PDF?',
      par(
        'Não há medida publicada de quanto cada arquivo em texto coincide com o seu PDF.'
      ),
      par(
        'Como os trechos são conferidos contra o arquivo em texto, e não contra o PDF, uma diferença de extração poderia passar. Por isso cada trecho traz a página do PDF: você pode abrir o original e comparar.'
      )
    ),
  ]);
}

function secaoTesteCego(): SecaoPronta {
  return secao('teste-cego', 'O teste cego', [
    par(
      'No teste cego você recebe cinco planos com os nomes escondidos e ordena, do que mais gostou ao que menos gostou. Cada plano mostra os cinco eixos, cada um com a frase do teste e o parágrafo do plano em volta.'
    ),
    cartao(
      'Como os planos aparecem',
      lista(
        ['Os cinco planos ganham apelidos neutros, ', forte('Plano 1 a Plano 5'), ', pela ordem em que aparecem na tela.'],
        ['A ordem dos planos na tela é sorteada a cada jornada, com embaralhamento uniforme: cada plano tem a mesma chance de cair em cada posição. O sorteio fica guardado no seu navegador, então recarregar a página mantém a ordem; refazer a jornada sorteia de novo.'],
        ['Só depois de você fechar a ordem a Revelação mostra de quem era cada plano.']
      )
    ),
    cartao(
      'A máscara: o que fica escondido na hora de escolher',
      par(
        'Durante a escolha (teste cego e quiz) você não pode reconhecer o autor do trecho. Por isso a máscara troca, por regras fixas e sempre as mesmas para os cinco candidatos, duas famílias de termos:'
      ),
      lista(
        [
          forte('Identificadores diretos viram '),
          cod('[***]'),
          ': nomes de candidatos e de vices, nome e sigla de partidos (Luiz Inácio Lula da Silva, Lula, Flávio Bolsonaro, Ronaldo Caiado, Augusto Cury, Renan Santos, Partido dos Trabalhadores, Partido Liberal, Partido Missão, União Brasil, PT, PL, PSDB, MDB, PSD, PP, PSB, PDT, PSOL, Republicanos); o estado-sede do autor; cabeçalhos e rodapés de página que carregam o autor (o bloco inteiro vira um marcador só); nomes de políticos citados no plano; o instituto do próprio autor; e a autorreferência de quem governa ou vai governar (nosso governo, nossa gestão, atual gestão, nosso mandato, senador e futuro presidente do Brasil).',
        ],
        [
          forte('Nomes de programas e marcas de campanha, do autor ou do governo, '),
          'viram um ',
          forte('rótulo neutro'),
          ' entre colchetes que descreve o que o programa é, como ',
          cod('[programa federal de atenção médica]'),
          ' ou ',
          cod('[plano de segurança prisional]'),
          ', para a proposta continuar legível. Os rótulos vêm de um ',
          forte('dicionário versionado'),
          ` (${ROTULOS_PROGRAMAS.length} entradas hoje, em `,
          cod('site/src/data/rotulos-programas.json'),
          '), igual para os cinco candidatos: a mesma regra e o mesmo esforço para todos, sem lista por candidato no site.',
        ]
      ),
      par(
        'Dois scripts conferem o resultado: um confirma que a diferença entre o texto literal e o mascarado está apenas nos marcadores e rótulos, e outro falha se qualquer termo do dicionário ou identificador direto sobrar num texto mascarado.'
      )
    ),
    cartao(
      'Onde cada versão aparece',
      lista(
        ['Teste cego e quiz: trecho, parágrafo em volta e justificativas dos critérios saem mascarados. O verso do card do quiz mostra as justificativas mascaradas pela mesma regra, e a fonte da avaliação não aparece no quiz (o nome do arquivo do plano revelaria o autor).'],
        ['Revelação do teste cego: mostra lado a lado como você leu e o texto original, com os nomes.'],
        ['Resultado: o texto original (literal) é revelado só no Resultado, depois de você escolher. O painel “Ver voto a voto” mostra o trecho literal com o candidato e as justificativas originais, sem máscara.'],
        ['Comparador: o autor já foi revelado, então mostra as justificativas e as fontes originais.']
      )
    ),
    cartao(
      'O que a máscara não esconde',
      par(
        'A máscara não esconde: leis, artigos da Constituição e números de norma; instituições públicas genéricas e siglas de órgãos (STF, BNDES, SUS, INSS e semelhantes); dados e fontes. Nas dúvidas entre marca de programa e instituição ou norma, o termo fica sem máscara. Ela também não disfarça o estilo do texto, as ideias, as bandeiras, os números, os jargões nem a forma de argumentar, e tudo isso pode denunciar o autor de um plano para quem conhece os candidatos. Nomes de pessoas ou partidos que não estejam nas listas acima também não são mascarados.'
      ),
      par(
        'O teste ajuda você a focar na ideia antes do nome, mas não garante anonimato absoluto.'
      ),
      par(
        'Além disso, os arquivos de dados que o navegador baixa entregam o autor de cada trecho: os identificadores internos têm o nome do candidato, o arquivo dos trechos traz o campo candidato_id e o texto sem máscara, e as avaliações citam o nome do arquivo do plano como fonte. A tela não mostra nada disso, mas quem abrir os arquivos consegue ver de quem é cada trecho.'
      )
    ),
  ]);
}

function secaoContexto(): SecaoPronta {
  return secao('contexto', 'O contexto ampliado', [
    par(
      'Uma frase solta pode enganar. Por isso cada trecho vem com o parágrafo do plano em volta, no botão “Ver o parágrafo completo”, com a frase do teste destacada.'
    ),
    cartao(
      'A regra é uma só, mecânica, igual para os cinco',
      passos(
        ['Começa pelo parágrafo (ou parágrafos) que contém a frase.'],
        ['Se o resultado tiver menos de 650 caracteres, junta os parágrafos vizinhos, um a um, sem atravessar um título e sem passar de 1300 caracteres.'],
        ['Se ainda passar de 1300, recorta em fronteira de frase, sempre com a frase do teste dentro.'],
        ['Um título logo acima do trecho entra como abertura.'],
        ['Tira os números de página soltos e colapsa espaços. O texto continua literal: nada é reescrito.']
      ),
      par(
        'Como os vizinhos podem ser títulos ou não caber no teto, alguns contextos ficam abaixo de 650 caracteres.'
      )
    ),
    cartao(
      'Como é conferido',
      lista(
        ['O script de verificação confirma que o contexto existe no arquivo original, entre as linhas registradas, sem os números de página.'],
        ['Confirma também que o contexto contém a frase do trecho.'],
        ['O contexto passa pela mesma máscara do trecho, e cada contexto tem o seu hash SHA-256.']
      ),
      par('A conferência da máscara feita pelo script cobre a frase do trecho e o contexto: em ambos, a diferença entre o literal e o mascarado só pode ser o marcador ou o rótulo de programa.')
    ),
  ]);
}

function secaoQuiz(): SecaoPronta {
  return secao('quiz', 'O quiz e a afinidade', [
    par(
      'O quiz tem ',
      forte('15 perguntas'),
      ', ',
      forte('3 por eixo'),
      ', em ',
      forte('5 eixos: Segurança, Economia, Educação, Reformas e Saúde'),
      '. Cada pergunta é um subtema (por exemplo, o sistema prisional) e você escolhe, entre trechos mascarados de 3 a 5 planos, o que faz mais sentido para você.'
    ),
    cartao(
      'Como as perguntas são montadas',
      lista(
        ['Há 15 subtemas, 3 em cada um dos 5 assuntos, e os 15 entram em toda sessão. O sorteio só embaralha a ordem dos assuntos e dos subtemas, e as perguntas saem intercaladas: nunca duas do mesmo assunto em sequência.'],
        ['Cada pergunta mostra de 3 a 5 trechos mascarados, um por candidato, entre os que têm uma proposta concreta naquele subtema.'],
        ['Igualdade de aparições: em cada sessão, os cinco candidatos aparecem como opção exatamente o mesmo número de vezes. O limite é o candidato com menos trechos nos planos, então os trechos dos candidatos que têm mais do que isso ficam de fora, e quais ficam é sorteado a cada sessão. Quem sai de cada pergunta é sorteado, e o sorteio só conta aparições: não olha o trecho, o veredito nem a concretude.'],
        ['O sorteio é aleatório e muda a cada sessão. As perguntas sorteadas ficam guardadas no seu aparelho enquanto você faz o quiz: recarregar a página no meio não as muda. Ao terminar e refazer o teste, o sorteio é novo.'],
        ['Cada pergunta tem uma opção de escape: “Nenhuma das opções / Pular”.'],
        ['Depois de cada escolha, o card que você escolheu vira e mostra no verso os cinco critérios de viabilidade do trecho, ainda sem dizer de quem é. O autor só aparece no Resultado.'],
        ['O ranking do Resultado mostra só o nome de cada candidato e a porcentagem de afinidade, sem selo de concretude. O botão “Ver voto a voto” abre um painel com todos os seus votos: para cada um, o candidato escolhido, a pergunta, o trecho e os cinco critérios, com o selo de concretude de cada trecho.']
      )
    ),
    cartao(
      'A regra de afinidade',
      par(
        forte('afinidade do candidato = respostas em que você escolheu o trecho dele ÷ perguntas em que você escolheu algum candidato × 100')
      ),
      lista(
        ['Escape e pulo não entram na conta, nem no numerador nem no divisor.'],
        ['Exemplo: você escolheu algum trecho em 8 perguntas, e 4 eram do mesmo candidato. Afinidade: 4 ÷ 8 × 100 = 50%.'],
        ['Com menos de 5 perguntas escolhidas, o resultado mostra o aviso de base pequena.'],
        ['Se dois ou mais candidatos empatam no topo, todos recebem o mesmo destaque.'],
        ['Se você pulou todas, não há afinidade a calcular e o site diz isso.']
      )
    ),
  ]);
}

function estadoCarregando(): HTMLElement {
  return el('p', { class: 'metodo-nota', texto: 'Carregando os critérios...' });
}

function estadoErroCriterios(): HTMLElement {
  return criarAviso(
    'Não foi possível carregar os critérios agora.',
    'Tente recarregar a página. Os critérios estão no arquivo criterios.json, na pasta site/public/data do repositório.'
  );
}

function montarCriterios(dados: Criterios): HTMLElement[] {
  const data = formatarDataPublicacao(dados.publicado_em);
  return [
    criarAviso(
      'Status dos critérios',
      `Versão ${dados.versao}, publicada em ${data}. Os critérios valem igual para os cinco candidatos. Se algum mudar, a nova versão é publicada com a data e reaplicada aos cinco.`
    ),
    cartao(
      'A escala de vereditos',
      el(
        'ol',
        { class: 'metodo-escala' },
        ...dados.escala.map((nivel, i) => el('li', {}, el('span', { class: 'chip', texto: `${i + 1}. ${nivel}` })))
      ),
      par('Não há ranking de candidatos nem nota geral por candidato. Cada trecho tem o veredito por critério e o selo de concretude (N de 5). No Resultado, ao lado da sua afinidade, aparece a concretude média dos planos de cada candidato, em porcentagem, e tocar no candidato abre as propostas dele. A lista segue a ordem da sua afinidade, não da concretude.')
    ),
    cartao('As regras', el('ul', { class: 'metodo-lista' }, ...dados.regras.map((r) => el('li', { texto: r })))),
    el(
      'div',
      { class: 'pilha metodo-criterios' },
      ...dados.criterios.map((c) =>
        detalhes(
          `${c.id} · ${c.nome}`,
          par(forte('Pergunta: '), c.pergunta),
          par(forte('Evidência exigida: '), c.evidencia),
          el(
            'div',
            { class: 'metodo-niveis' },
            ...niveisEmOrdem(dados.escala, c.niveis).map((n) =>
              el('div', { class: 'metodo-nivel' }, el('span', { class: 'chip', texto: n.nivel }), el('p', { texto: n.texto }))
            )
          )
        )
      )
    ),
  ];
}

async function secaoViabilidade(): Promise<SecaoPronta> {
  const area = el('div', { class: 'pilha' }, estadoCarregando());
  let dados: Criterios | null = null;
  try {
    dados = await carregarJSON(import.meta.env.BASE_URL + 'data/criterios.json', CriteriosSchema);
  } catch (e) {
    console.warn('Falha ao carregar os critérios', e);
  }
  area.replaceChildren(...(dados ? montarCriterios(dados) : [estadoErroCriterios()]));

  return secao('viabilidade', 'Critérios de viabilidade', [
    par(
      'Além do texto literal, o Comparador traz uma avaliação de viabilidade de cada trecho. Ela usa ',
      forte('cinco critérios'),
      ', os mesmos para os cinco candidatos, incluindo o do Partido Missão, com a mesma escala. Hoje, cada trecho avaliado, no Comparador e no quiz, recebe cinco avaliações, uma por critério. Toda avaliação tem justificativa e fonte. Sem fonte, o veredito é “Sem base para avaliar”.'
    ),
    par(
      'No Comparador, cada avaliação traz também o bloco “Outro lado”: o que fontes abertas dizem que pode relativizar o veredito, com a fonte indicada e uma conclusão sobre se o veredito se sustenta. O “Outro lado” não muda o veredito.'
    ),
    par(
      forte('“Sem base para avaliar” '),
      'não entra na concretude: quer dizer que não foi possível sustentar um nível com fonte aberta e conferida, e a falta de fonte aparece na concretude. Vale igual para os cinco candidatos. No critério de precedente (C4), só entra experiência com fonte aberta e conferida, com resultado medido (documento lido, URL e citação literal); relato auto-depositado sem controle, notícia de meta futura e divulgação institucional fraca não sustentam nível sozinhos; sem isso, o veredito é “Sem base para avaliar”.'
    ),
    par(
      forte('O selo mostra a concretude do trecho. '),
      'Concretude é quantos dos cinco critérios deu para avaliar com fonte (“N de 5”): quanto mais critérios dá para checar, mais a proposta diz como, quanto, com que base e até quando. Ela não mede se a ideia é boa nem se vai dar certo; isso fica no veredito de cada critério, um a um. A mesma conta vale para os cinco candidatos.'
    ),
    area,
    par(
      'As avaliações medem a exigência legal, a fonte de recurso, a dependência do Congresso, o precedente e o prazo. Não são parecer jurídico e não dizem se a proposta é boa ou ruim.'
    ),
  ]);
}

function secaoIA(): SecaoPronta {
  return secao('ia', 'O que é dado e o que foi gerado por IA', [
    par(
      'Este projeto usou assistentes de inteligência artificial no trabalho. A regra é que nada gerado por IA vira texto de plano: o que aparece como frase de candidato vem sempre do arquivo original.'
    ),
    cartao(
      'O que é dado',
      lista(
        ['As frases de cada plano, copiadas do texto extraído do PDF oficial e conferidas por script.'],
        ['Os parágrafos de contexto, montados por uma regra mecânica sobre esse mesmo texto.'],
        ['A máscara, aplicada por uma lista fixa de nomes e siglas.'],
        ['Os critérios e a escala de viabilidade, decididos pela equipe do projeto e publicados em arquivo.']
      )
    ),
    cartao(
      'O que foi gerado por IA, e o que mudou por causa disso',
      par(
        'Foram geradas por IA análises de cada plano, uma por candidato (arquivos ',
        cod('Analise_*.md'),
        ' na pasta ',
        cod('Planos_TSE'),
        '). Elas diziam conter trechos literais. A equipe conferiu por busca de texto nos originais: das 45 citações, 9 estavam literais, 6 parcialmente e 30 não foram achadas. As ideias existem nos originais, mas muitas frases estavam condensadas.'
      ),
      par(
        'Por isso essas análises não são usadas como fonte de nenhum texto do site. Servem só para saber que ideias cobrir, e todo trecho publicado vem direto dos arquivos ',
        cod('*_Plano_Original.md'),
        ', com arquivo e linhas.'
      ),
      par(
        'Nas avaliações de viabilidade, cada trecho foi avaliado por um assistente de IA que atua como defensor honesto do plano, depois por um avaliador independente que não sabe de quem é o trecho e por um auditor de consistência. As normas e os precedentes foram conferidos em fonte aberta, e o que não foi conferido ficou como “Sem base para avaliar”. Os dados das avaliações estão no repositório, em docs/avaliacao/final. Cada avaliação traz justificativa e fonte, para que qualquer pessoa possa conferir.'
      )
    ),
  ]);
}

function secaoVerificacoes(): SecaoPronta {
  return secao('verificacoes', 'Verificações automáticas', [
    par(
      'Estes são os scripts que existem na pasta ',
      cod('site/scripts'),
      ', com o que cada um faz de verdade.'
    ),
    cartao(
      'A cadeia do build',
      par(
        'A cada ',
        cod('npm run build'),
        ' rodam, nesta ordem: ',
        cod('gerar-manifesto'),
        ', ',
        cod('verificar-trechos'),
        ', ',
        cod('build-painel'),
        ', ',
        cod('verificar-mascaras'),
        ', ',
        cod('verificar-programas'),
        ', ',
        cod('verificar-quiz-subtemas'),
        ', ',
        cod('verificar-demo'),
        ', ',
        cod('verificar-anonimato'),
        ' e ',
        cod('verificar-blueprint'),
        ', depois a checagem de tipos (',
        cod('tsc --noEmit'),
        ') e o ',
        cod('vite build'),
        '. Um erro em qualquer passo para o build.'
      ),
      par(
        'A publicação roda apenas ',
        cod('npm run build'),
        ' (arquivo ',
        cod('.github/workflows/deploy.yml'),
        '), ou seja, essa cadeia inteira. Os testes automáticos (',
        cod('npm test'),
        ') não rodam na publicação: são executados por quem mantém o projeto.'
      )
    ),
    detalhes(
      'Regras do código (roda no build)',
      par(
        cod('verificar-blueprint'),
        ': varre o código-fonte e falha o build se achar API que injeta HTML, chamada de rede para endereço externo, script ou link externo, cor ou tamanho escritos fora dos tokens de design, emoji ou uma palavra vetada pela equipe. É uma busca por texto, não uma análise completa do código.'
      )
    ),
    detalhes(
      'Trechos e contexto',
      lista(
        [
          cod('build-trechos'),
          ': monta o ',
          cod('trechos.json'),
          ' a partir das frases fixadas no próprio script. Para no primeiro erro se uma frase não estiver no original, e grava linhas, página, máscara, contexto e hashes.',
        ],
        [cod('extrair-trecho'), ': localiza uma frase num arquivo, tolerando quebra de linha e hifenização de fim de linha. É a peça usada pelo script anterior.'],
        [cod('contexto'), ': a regra do parágrafo em volta, descrita na seção do contexto.'],
        [
          cod('verificar-trechos'),
          ': relê cada trecho e cada contexto no arquivo original, nas linhas registradas. Aponta arquivo inexistente, trecho não encontrado, contexto não encontrado ou contexto sem o trecho.',
        ]
      )
    ),
    detalhes(
      'Máscara e anonimato',
      lista(
        [cod('verificar-mascaras'), ': garante que a versão mascarada de cada trecho difere da literal só onde há ', cod('[***]'), ' ou um rótulo neutro de programa.'],
        [
          cod('verificar-programas'),
          ': falha se qualquer termo do dicionário de programas ou identificador direto (nome, partido, cabeçalho, autorreferência) sobrar num texto mascarado, ou se o quiz passar a ler a fonte da avaliação.',
        ],
        [
          cod('verificar-anonimato'),
          ': procura por nomes e contatos pessoais no repositório e falha com código de saída 1 se achar. Cobre site/, docs/, design/ e .github/. Os logs de auditoria em .sled/ ficam fora por serem imutáveis por design do sistema de governança.',
        ]
      )
    ),
    detalhes(
      'Quiz',
      lista([
        cod('build-data'),
        ': gera a versão sem nomes dos planos do teste cego (',
        cod('planos_cegos.json'),
        ').',
      ]),
      lista([
        cod('build-quiz-data'),
        ': gera os dados do quiz por subtemas (subtemas, trechos, planos sem nomes e avaliações) a partir dos planos originais, com linhas, página, hash, máscara e contexto.',
      ]),
      lista([
        cod('verificar-quiz-subtemas'),
        ': confere que cada assunto tem ao menos 3 subtemas com 3 ou mais candidatos, que cada trecho tem 5 avaliações dentro da escala, que o texto literal existe no plano original e que hash e máscara batem. Também falha se algum nome de candidato ou de partido aparecer no texto que o eleitor lê, se “Inviável nos termos propostos” for publicado ou se um termo interno de trabalho aparecer nas justificativas. Roda no build.',
      ])
    ),
    detalhes(
      'Outro lado das avaliações',
      lista([
        cod('build-painel'),
        ': junta o “Outro lado” de cada avaliação (arquivo de pesquisa da pasta pesquisa) ao avaliacoes.json, por trecho e critério. Falha o build se faltar chave, se a conclusão citar um veredito diferente do publicado ou se o texto vier sem fonte, e nunca altera veredito, justificativa nem fonte. No build, só confere que o arquivo está em dia.',
      ])
    ),
    detalhes(
      'Demonstração',
      lista([
        cod('verificar-demo'),
        ': confere que os trechos da demonstração do início não aparecem no teste cego nem no quiz, que cada um existe no plano original, que a máscara só difere nos marcadores e que o hash bate. Roda no build.',
      ])
    ),
    detalhes(
      'Hashes e integridade',
      lista([
        cod('gerar-manifesto'),
        ': calcula o SHA-256 de cada arquivo da pasta pública e grava um manifesto. O manifesto está em manifesto.json e é gerado a cada build. Com a opção ',
        cod('--check'),
        ', compara hashes e aponta arquivos modificados.',
      ])
    ),
    detalhes(
      'Design',
      lista(
        [cod('gerar-tokens'), ': gera os arquivos de cores, tamanhos e tempos a partir do design system, para o site não repetir valores.'],
        [cod('gerar-onca-borda'), ': gera o desenho da onça sem o quadro preto, a partir da logo oficial, que não é alterada.']
      )
    ),
  ]);
}

function secaoPrivacidade(): SecaoPronta {
  return secao('privacidade', 'Privacidade (LGPD)', [
    par(
      'O site funciona inteiro no seu navegador. Não há conta, cadastro, servidor de respostas nem ferramenta de medição de acessos. A imagem do resultado para compartilhar é gerada no seu aparelho.'
    ),
    cartao(
      'O que fica guardado, e onde',
      lista(
        [
          'Um único registro no armazenamento local do navegador, com a chave ',
          cod('mq.sessao.v1'),
          '.',
        ],
        ['Nele ficam a ordem dos planos que você escolheu, as perguntas sorteadas e as respostas do quiz, se você já viu a revelação e se terminou o teste.'],
        ['Na memória da aba (armazenamento de sessão do navegador), a chave ', cod('mq.wizard.slide'), ' guarda só o número do slide do tutorial em que você parou. Ela some quando você fecha a aba.'],
        ['Se o navegador bloquear o armazenamento local, os dados ficam só na memória e se perdem ao recarregar a página.']
      )
    ),
    cartao(
      'Como apagar',
      lista(
        ['Na tela inicial, os botões “Começar teste cego”, “Refazer o teste” e “Recomeçar” apagam a sessão (ordem, perguntas e respostas) antes de iniciar de novo.'],
        ['Para apagar tudo de uma vez, limpe os dados do site nas configurações do navegador.'],
        ['Não existe um botão separado só para apagar.']
      ),
      par(
        'Como em qualquer site, o servidor que entrega as páginas recebe o pedido de cada arquivo. O site é publicado pelo GitHub Pages. As suas respostas não são enviadas.'
      )
    ),
  ]);
}

function secaoLimites(): SecaoPronta {
  return secao('limites', 'Limites e o que ainda não foi feito', [
    par('Este é o estado atual do projeto, item por item.'),
    cartao(
      'Pendências',
      lista(
        [forte('Fotos dos candidatos: '), 'na tela de candidatos da Missão no Paraná as fotos são as oficiais do TSE. No teste cego e no quiz o site usa avatar neutro, para não identificar ninguém.'],
        [forte('Viabilidade: '), 'as avaliações dependem de pesquisa e podem ser corrigidas depois, com a fonte indicada. Os critérios em si não mudam. Nenhuma avaliação deve ser lida como interpretação da lei.'],
        [forte('Candidatos da Missão no PR: '), 'a tela traz os candidatos com dados públicos do TSE e da imprensa e fonte em cada item. A maioria tem só dados cadastrais, sem propostas publicadas, e a tela diz isso.'],
        [forte('Manifesto de hashes: '), 'o manifesto de hashes (', cod('manifesto.json'), ') é gerado e publicado junto com o site a cada build.'],
        [forte('Canal de contestação: '), 'esta versão não tem canal no site para enviar contestações.']
      )
    ),
    cartao(
      'Limites do método',
      lista(
        ['No teste cego cada candidato entra com 5 frases, uma por eixo; no quiz, com uma frase por subtema. Elas não resumem o plano. Para decidir, leia o plano completo.'],
        ['A escolha dessas frases foi feita pela equipe e não segue um critério automático.'],
        ['Nem todo candidato tem uma proposta concreta em todos os subtemas do quiz. Por isso o sorteio equilibra a quantidade de vezes em que cada um aparece como opção em cada sessão. O equilíbrio é de quantidade, não de qualidade: não indica que os trechos tenham o mesmo grau de detalhe.'],
        ['Muitas avaliações saem como “Sem base para avaliar”: os planos de governo são genéricos, e a régua só avalia o que está escrito e tem fonte.'],
        ['Tanto no teste cego quanto no quiz a ordem é sorteada por sessão e guardada para o recarregamento não trocá-la. O sorteio uniforme tira o viés de posição, mas uma amostra pequena de sessões ainda pode mostrar algum plano mais vezes no topo por acaso.'],
        ['A máscara é uma lista fixa de nomes e siglas, e o texto ainda pode denunciar o autor.'],
        ['A afinidade mede o quanto você concordou com 15 frases. Não mede o quanto você concorda com um programa de governo.'],
        ['A conferência dos trechos usa o texto extraído do PDF. Diferenças de extração são possíveis, por isso a página do PDF acompanha cada trecho.']
      )
    ),
  ]);
}

const URL_ARQUIVO = URL_REPOSITORIO + '/blob/main/';

function secaoConstrucao(): SecaoPronta {
  const arquivo = (rotulo: string, caminho: string) => link(rotulo, URL_ARQUIVO + caminho, 'metodo-fonte');
  return secao('construcao', 'Como foi construído', [
    par(
      'Este site foi construído com o SDM Sled-Development-Method, método próprio da SlyvSolutions: um pipeline ',
      cod('new_project'),
      ' de perfil ',
      cod('team'),
      ', com fases, portões de aprovação e uma trilha de auditoria em que cada registro guarda o hash do registro anterior. Contato da SlyvSolutions: (41) 99946-7052.'
    ),
    cartao(
      'O que dá para conferir',
      lista(
        ['Cada frase de candidato é rastreada a arquivo e linha do plano oficial, e o build reprova trecho que não seja literal.'],
        ['O build também reprova máscara que mude algo além dos marcadores, e cada trecho e cada contexto têm o seu hash SHA-256 publicado.'],
        ['O que ainda falta está na seção Limites, e nada aqui garante que o resultado esteja certo.']
      )
    ),
    cartao(
      'Os arquivos',
      lista(
        [arquivo('Verificador de trechos literais', 'site/scripts/verificar-trechos.ts')],
        [arquivo('Manifesto de hashes SHA-256', 'site/public/manifesto.json')],
        [arquivo('Fluxo de publicação', '.github/workflows/deploy.yml')]
      )
    ),
  ]);
}

function secaoFontes(): SecaoPronta {
  return secao('fontes', 'Fontes e links', [
    par('Tudo o que está nesta página pode ser conferido nas fontes abaixo.'),
    el(
      'div',
      { class: 'metodo-fontes-list' },
      link('Portal DivulgaCand (TSE): planos de governo oficiais', URL_DIVULGACAND, 'metodo-fonte'),
      link('Repositório do projeto no GitHub', URL_REPOSITORIO, 'metodo-fonte')
    ),
  ]);
}

/* ---------- Sumário e tela ---------- */

function irPara(secaoProxima: SecaoPronta): void {
  const alvo = document.getElementById(secaoProxima.id);
  if (!alvo) return;
  alvo.scrollIntoView({ block: 'start' });
  const titulo = alvo.querySelector<HTMLElement>('h3');
  titulo?.focus({ preventScroll: true });
}

function criarSumario(secoes: SecaoPronta[]): HTMLElement {
  return el(
    'nav',
    { class: 'metodo-sumario', attrs: { 'aria-label': 'Sumário desta página' } },
    el('h4', { texto: 'Nesta página' }),
    el(
      'ol',
      { class: 'metodo-sumario-lista' },
      ...secoes.map((s, i) => {
        const botao = el(
          'button',
          { class: 'metodo-sumario-item', attrs: { type: 'button' } },
          el('span', { class: 'metodo-sumario-num', texto: numeroDaSecao(i + 1), attrs: { 'aria-hidden': 'true' } }),
          s.titulo
        );
        botao.addEventListener('click', () => irPara(s));
        return el('li', {}, botao);
      })
    )
  );
}

function secaoSimplesOQueE(): SecaoPronta {
  return secao('simples-oque-e', 'O que é', [
    par(
      'O ',
      forte('Missão Quiz'),
      ' ajuda o eleitor a comparar, sem rótulo, os planos de governo oficiais dos cinco candidatos à Presidência.'
    )
  ]);
}

function secaoSimplesComoFunciona(): SecaoPronta {
  return secao('simples-como-funciona', 'Como funciona', [
    passos(
      [forte('Teste Cego: '), 'você ordena planos sem saber de quem são.'],
      [forte('Revelação: '), 'os nomes aparecem.'],
      [forte('Quiz: '), '15 perguntas, escolha entre trechos do mesmo eixo.'],
      [forte('Resultado + Comparador: '), 'veja com quem mais se alinhou e explore os detalhes.']
    )
  ]);
}

function secaoSimplesMissao(): SecaoPronta {
  return secao('simples-missao', 'É do Partido Missão. Você pode confiar?', [
    par('Não precisa confiar, confira. A mesma régua para os 5 candidatos, inclusive o do Missão:'),
    lista(
      ['Trechos copiados dos planos depositados no TSE, com arquivo e linha para você conferir.'],
      ['Nomes só aparecem depois.'],
      ['Código aberto no GitHub.']
    )
  ]);
}

function secaoSimplesPrivacidade(): SecaoPronta {
  return secao('simples-privacidade', 'Privacidade', [
    par('Nada sai do seu aparelho. Não há conta, cadastro nem envio de dados para servidores.')
  ]);
}

export async function renderMetodo(): Promise<HTMLElement> {
  const container = el('div', { class: 'screen-metodo tela' });

  container.appendChild(
    el(
      'header',
      { class: 'tela-topo metodo-header' },
      el(
        'div',
        { class: 'conteudo' },
        el('p', { class: 'eyebrow', texto: 'Transparência' }),
        el('h2', { texto: 'Método e Fontes' }),
        el('p', {
          class: 'lead',
          texto:
            'Como cada parte deste site foi feita, com os critérios, os números e os limites. Tudo aqui pode ser conferido nos planos originais e no código aberto.',
        })
      )
    )
  );

  const secoesSimples: SecaoPronta[] = [
    secaoSimplesOQueE(),
    secaoSimplesComoFunciona(),
    secaoSimplesMissao(),
    secaoSimplesPrivacidade()
  ];

  const secoesTecnicas: SecaoPronta[] = [
    secaoVisaoGeral(),
    secaoGithub(),
    secaoTextos(),
    secaoTesteCego(),
    secaoContexto(),
    secaoQuiz(),
    await secaoViabilidade(),
    secaoIA(),
    secaoVerificacoes(),
    secaoPrivacidade(),
    secaoLimites(),
    secaoConstrucao(),
    secaoFontes(),
  ];

  secoesSimples.forEach((s, i) => {
    s.no.prepend(el('span', { class: 'eyebrow', texto: numeroDaSecao(i + 1) }));
  });
  secoesTecnicas.forEach((s, i) => {
    s.no.prepend(el('span', { class: 'eyebrow', texto: numeroDaSecao(i + 1) }));
  });

  const containerSimples = el('div', { class: 'metodo-modo-simples' },
    criarSumario(secoesSimples),
    el('div', { class: 'metodo-secoes' }, ...secoesSimples.map(s => s.no))
  );

  const containerTecnico = el('div', { class: 'metodo-modo-tecnico', attrs: { style: 'display: none;' } },
    criarSumario(secoesTecnicas),
    el('div', { class: 'metodo-secoes' }, ...secoesTecnicas.map(s => s.no))
  );

  const btnSimples = el('button', { class: 'btn-pill btn-primaria', texto: 'Explicação simples' });
  const btnTecnico = el('button', { class: 'btn-pill btn-secundaria', texto: 'Versão técnica' });
  
  const toggleArea = el('div', { class: 'metodo-toggle', attrs: { style: 'display: flex; gap: var(--mq-espaco-3); margin-bottom: var(--mq-espaco-6); justify-content: center;' } }, btnSimples, btnTecnico);

  btnSimples.addEventListener('click', () => {
    btnSimples.className = 'btn-pill btn-primaria';
    btnTecnico.className = 'btn-pill btn-secundaria';
    containerSimples.style.display = '';
    containerTecnico.style.display = 'none';
  });

  btnTecnico.addEventListener('click', () => {
    btnTecnico.className = 'btn-pill btn-primaria';
    btnSimples.className = 'btn-pill btn-secundaria';
    containerSimples.style.display = 'none';
    containerTecnico.style.display = '';
  });

  container.appendChild(
    el(
      'div',
      { class: 'conteudo metodo-content' },
      toggleArea,
      containerSimples,
      containerTecnico
    )
  );

  return container;
}
