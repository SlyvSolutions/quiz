import { lerSessao, salvarSessao } from '../../state/sessao-storage';
import { criarBotaoPill } from '../../ui/botao';
import { criarAvatarNeutro } from '../../ui/avatar';
import { criarAviso, criarAvisoFalhaCandidatos, AVISO_AUTORIA } from '../../ui/aviso';
import { carregarCandidatos, type NomesCandidatos } from '../../data/candidatos';
import { el } from '../../ui/dom';
import { animarContador, animarBarra } from '../../motion/contador';
import { navigate } from '../../app/router';
import { RESPOSTA_PULAR, montarVotos, type AvaliacaoPublica } from '../../core/votos';
import type { SubtemaQuiz } from '../../core/sorteio-quiz';
import type { CriterioInfo } from '../../ui/slide-criterios';
import { TOTAL_PERGUNTAS } from '../../core/jornada';
import { abrirPainelVotos } from './revelacao-votos';
import { abrirModalCandidato } from './modal-candidato';
import { concretudeDoCandidato, type AvaliacaoDeTrecho } from '../../core/concretude';

interface Trecho {
  id: string;
  candidato_id: string;
  eixo: string;
  subtema_id?: string;
  texto_literal: string;
}


function criarTopo(total: number): HTMLElement {
  return el(
    'header',
    { class: 'tela-topo res-header' },
    el(
      'div',
      { class: 'conteudo' },
      el('p', { class: 'eyebrow', texto: 'Passo 3 · Suas escolhas, os planos reais' }),
      el('h2', { texto: 'Seu Resultado' }),
      el('p', {
        class: 'lead',
        texto:
          `Concordância entre o que você escolheu e ${total} trechos dos planos. Não é recomendação de voto: é um espelho das suas escolhas em ${total} frases.`,
      })
    )
  );
}

/** A frase presa fecha o resultado: "O futuro é glorioso", linha a linha, amarrada à rolagem. */
function criarFrasePresa(): HTMLElement {
  const linha1 = el('p', { class: 'frase-presa-linha', texto: 'O futuro é' });
  linha1.style.setProperty('--i', '0');
  const linha2 = el('p', { class: 'frase-presa-linha' }, el('span', { class: 'glorioso', texto: 'glorioso' }));
  linha2.style.setProperty('--i', '1');
  return el(
    'section',
    { class: 'frase-presa', data: { fixo: '' }, attrs: { 'aria-label': 'O futuro é glorioso' } },
    el('div', { class: 'frase-presa-pin' }, linha1, linha2)
  );
}

export async function renderResultado(): Promise<HTMLElement> {
  const container = el('div', { class: 'screen-resultado tela' });

  let NOME_CANDIDATOS: NomesCandidatos;
  try {
    NOME_CANDIDATOS = await carregarCandidatos();
  } catch (e) {
    console.error(e);
    container.appendChild(el('div', { class: 'conteudo tela-topo' }, criarAvisoFalhaCandidatos()));
    return container;
  }

  const sessao = lerSessao();
  const totalPerguntas = sessao?.perguntasQuiz?.length || TOTAL_PERGUNTAS;
  if (!sessao) {
    container.append(
      el('div', { class: 'conteudo tela-topo' }, el('h2', { texto: 'Sessão não encontrada' }))
    );
    return container;
  }

  // Marca como finalizado
  if (!sessao.finalizado) {
    salvarSessao({ ...sessao, finalizado: true });
  }

  let trechosOriginais: Trecho[] = [];
  try {
    const res = await fetch(import.meta.env.BASE_URL + 'data/trechos.json');
    if (res.ok) trechosOriginais = await res.json();
  } catch (e) {
    console.error(e);
  }

  // Dados do quiz por subtemas: opcionais. Sem eles o ranking aparece e a revelação some.
  const carregarOpcional = async <T,>(arquivo: string): Promise<T | null> => {
    try {
      const r = await fetch(import.meta.env.BASE_URL + 'data/' + arquivo);
      return r.ok ? ((await r.json()) as T) : null;
    } catch {
      return null;
    }
  };
  const [trechosQuiz, avaliacoesQuiz, subtemasQuiz, dadosCriterios, avaliacoesProg] = await Promise.all([
    carregarOpcional<Trecho[]>('trechos_quiz.json'),
    carregarOpcional<AvaliacaoPublica[]>('avaliacoes_quiz.json'),
    carregarOpcional<SubtemaQuiz[]>('subtemas.json'),
    carregarOpcional<{ criterios: CriterioInfo[] }>('criterios.json'),
    carregarOpcional<AvaliacaoDeTrecho[]>('avaliacoes.json'),
  ]);
  // Concretude dos planos: programa + quiz, todos os trechos avaliados de cada candidato.
  const todasAvaliacoes: AvaliacaoDeTrecho[] = (avaliacoesProg ?? []).concat((avaliacoesQuiz as AvaliacaoDeTrecho[] | null) ?? []);
  // Para achar quem foi votado vale qualquer trecho; a concretude de cada candidato usa os trechos do programa e do quiz
  const trechosParaVoto: Trecho[] = trechosOriginais.concat(trechosQuiz ?? []);

  const respostas = Object.values(sessao.respostasQuiz);
  const escolhasValidas = respostas.filter((r) => r !== RESPOSTA_PULAR);
  const totalValidas = escolhasValidas.length;

  container.appendChild(criarTopo(totalPerguntas));

  if (totalValidas === 0) {
    container.appendChild(
      el(
        'div',
        { class: 'conteudo' },
        el(
          'div',
          { class: 'res-aviso-zero' },
          el('p', { texto: 'Você pulou todas as perguntas do Quiz.' }),
          el('p', {
            texto: 'Como não houve nenhuma escolha, não é possível calcular a sua afinidade com os planos de governo.',
          })
        )
      )
    );
  } else {
    if (totalValidas < 5) {
      container.appendChild(
        el(
          'div',
          { class: 'conteudo' },
          criarAviso(
            'Aviso:',
            `Você respondeu a poucas perguntas (${totalValidas} de ${totalPerguntas}). O percentual pode não refletir uma afinidade sólida.`
          )
        )
      );
    }

    // Contar votos por candidato
    const votosPorCandidato: Record<string, string[]> = {}; // candidato -> array de trecho ids
    Object.keys(NOME_CANDIDATOS).forEach((c) => (votosPorCandidato[c] = []));

    escolhasValidas.forEach((trechoId) => {
      const original = trechosParaVoto.find((t) => t.id === trechoId);
      const lista = original ? votosPorCandidato[original.candidato_id] : undefined;
      if (lista) lista.push(trechoId);
    });

    const ranking = Object.entries(votosPorCandidato)
      .map(([candidato_id, votos]) => ({
        candidato_id,
        votos,
        afinidade: (votos.length / totalValidas) * 100,
      }))
      .sort((a, b) => b.afinidade - a.afinidade);

    const topo = ranking[0]?.afinidade ?? 0;
    const list = el('div', { class: 'conteudo res-ranking-list' });

    ranking.forEach((item) => {
      const isEmpatePrimeiro = item.afinidade === topo && item.afinidade > 0;
      const info = NOME_CANDIDATOS[item.candidato_id];
      if (!info) return;

      const pct = Math.round(item.afinidade);
      const numero = el('span', { class: 'res-afinidade', attrs: { 'aria-label': `${pct}% de afinidade` } });
      animarContador(numero, pct);

      const preenchimento = el('div', { class: 'barra-preenchimento' });
      animarBarra(preenchimento, item.afinidade);

      const trechosDele = trechosParaVoto.filter((t) => t.candidato_id === item.candidato_id);
      const concretude = concretudeDoCandidato(trechosDele.map((t) => t.id), todasAvaliacoes);

      const card = el(
        'article',
        { class: `res-card ${isEmpatePrimeiro ? 'destaque' : ''}`.trim() },
        criarAvatarNeutro(info.nome),
        el(
          'div',
          { class: 'res-details' },
          el('div', { class: 'res-cand-head' }, el('h3', { texto: info.nome }), numero),
          el('div', { class: 'barra', attrs: { 'aria-hidden': 'true' } }, preenchimento)
        )
      );

      if (concretude) {
        const abrir = () =>
          abrirModalCandidato(
            info.nome,
            concretude,
            trechosDele
              .filter((t) => todasAvaliacoes.some((a) => a.trecho_id === t.id))
              .map((t) => ({
                rotulo: (t.subtema_id && subtemasQuiz?.find((st) => st.id === t.subtema_id)?.nome) || t.eixo,
                texto: t.texto_literal,
                avaliacoes: todasAvaliacoes.filter((a) => a.trecho_id === t.id),
              }))
          );
        // Botão de verdade (teclado e leitor de tela); o card inteiro também responde ao toque.
        const btnAbrir = criarBotaoPill('Ver propostas', 'secundaria', { seta: true });
        btnAbrir.classList.add('res-ver-propostas');
        btnAbrir.setAttribute('aria-label', `${info.nome}: ver propostas e concretude`);
        btnAbrir.addEventListener('click', (e) => {
          e.stopPropagation();
          abrir();
        });
        // Rodapé do card, na largura toda (o avatar não come espaço do texto e do botão).
        card.appendChild(
          el(
            'div',
            { class: 'res-card-rodape' },
            el('p', { class: 'res-concretude', texto: `Concretude dos planos: ${concretude.percentual}%` }),
            btnAbrir
          )
        );
        card.classList.add('res-card-clicavel');
        card.addEventListener('click', abrir);
      }

      list.appendChild(card);
    });

    container.appendChild(list);

    // A grande revelação: voto a voto, o autor e os 5 critérios, num painel aberto por botão.
    // Só se o quiz por subtemas está carregado.
    if (sessao.perguntasQuiz && trechosQuiz && avaliacoesQuiz && subtemasQuiz && dadosCriterios) {
      const votos = montarVotos(
        sessao.perguntasQuiz,
        sessao.respostasQuiz,
        trechosParaVoto,
        avaliacoesQuiz,
        subtemasQuiz
      );
      const btnVotos = criarBotaoPill('Ver voto a voto', 'secundaria', { seta: true });
      btnVotos.classList.add('res-ver-votos-btn');
      btnVotos.addEventListener('click', () => abrirPainelVotos(votos, dadosCriterios.criterios, NOME_CANDIDATOS));
      container.appendChild(
        el(
          'div',
          { class: 'conteudo res-votos-acao' },
          el('p', { texto: 'Veja de quem era cada trecho que você escolheu e o que os critérios dizem sobre ele.' }),
          btnVotos
        )
      );
    }
  }

  container.appendChild(
    el('div', { class: 'conteudo' }, el('p', { class: 'res-autoria', texto: AVISO_AUTORIA }))
  );

  // Fim da jornada: o Comparador abre. É a recompensa, então ganha destaque.
  container.appendChild(
    el(
      'div',
      { class: 'conteudo' },
      el(
        'div',
        { class: 'res-liberado card card-destaque' },
        el('span', { class: 'eyebrow', texto: 'Comparador liberado' }),
        el('h3', { texto: 'Agora você pode ver quem é quem' }),
        el('p', {
          texto:
            'Você completou o teste. Confira o texto literal, a fonte e a análise de viabilidade das propostas de cada candidato, lado a lado.',
        }),
        (() => {
          const b = criarBotaoPill('Abrir o Comparador', 'primaria', { seta: true });
          b.addEventListener('click', () => navigate('#comparador'));
          return b;
        })()
      )
    )
  );

  // Posição do Missão: rotulada, fora da avaliação e igual para todo eleitor, qualquer que seja o resultado.
  container.appendChild(
    el(
      'div',
      { class: 'conteudo' },
      el(
        'div',
        { class: 'res-posicao card' },
        el('span', { class: 'eyebrow', texto: 'Posição do Partido Missão · fora da avaliação' }),
        el('h3', { texto: 'Vote na base do Missão' }),
        el('p', {
          texto:
            'Esta seção é opinião dos apoiadores do Partido Missão. Ela não entra nas notas, nos critérios nem no seu resultado.',
        }),
        el('p', {
          texto:
            'Pedimos voto nos candidatos do Missão ao Congresso, para que as propostas tenham quem as defenda e fiscalize.',
        }),
        el('p', {
          texto:
            'Fato público: em 01/10/2026 o ministro Gilmar Mendes (STF) determinou a inclusão do candidato do Missão, Renan Santos, no debate presidencial da TV Globo, e a emissora cancelou o debate. A Lei 9.504/97 (art. 46) assegura a participação nos debates de candidatos de partidos com pelo menos cinco parlamentares no Congresso Nacional.',
        })
      )
    )
  );

  const btnShare = criarBotaoPill('Compartilhar Meu Resultado', 'primaria', { seta: true });
  btnShare.addEventListener('click', () => {
    navigate('#compartilhar');
  });

  container.appendChild(el('div', { class: 'conteudo res-footer' }, btnShare));
  container.appendChild(criarFrasePresa());

  return container;
}
