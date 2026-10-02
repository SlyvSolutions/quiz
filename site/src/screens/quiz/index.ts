import { lerSessao, salvarSessao } from '../../state/sessao-storage';
import { criarBarraDeProgresso } from '../../ui/progresso';
import { criarBotaoPill } from '../../ui/botao';
import { criarIcone } from '../../ui/icone';
import { criarContextoRecolhivel } from '../../ui/contexto';
import { criarSlideCriterios, type CriterioInfo } from '../../ui/slide-criterios';
import { el } from '../../ui/dom';
import { prefersReducedMotion } from '../../motion/reduced-motion';
import { navigate } from '../../app/router';
import { perguntasCompativeis, sortearPerguntas, type PerguntaSorteada, type SubtemaQuiz, type TrechoQuizRef } from '../../core/sorteio-quiz';
import { RESPOSTA_PULAR, type AvaliacaoPublica } from '../../core/votos';

interface PlanoQuiz {
  id: string;
  texto_mascarado: string;
  contexto_mascarado?: string;
}

const ATRASO_PULAR = 150; // ms (= --mq-dur-toque): dá tempo de ver o clique antes da próxima pergunta

let perguntas: PerguntaSorteada[] = [];
let planos = new Map<string, PlanoQuiz>();
let avaliacoes: AvaliacaoPublica[] = [];
let criterios: CriterioInfo[] = [];
let currentStep = 0;
let respostasTemporarias: Record<string, string> = {};
/** Trecho escolhido na pergunta atual, enquanto o slide dos critérios está na tela */
let escolhido: string | null = null;
let travado = false;

function criarErro(mensagem: string): HTMLElement {
  const container = el('div', { class: 'screen-quiz' });
  const btnVoltar = criarBotaoPill('Voltar ao Início', 'secundaria');
  btnVoltar.addEventListener('click', () => navigate('#inicio'));
  container.append(el('h2', { texto: mensagem }), btnVoltar);
  return container;
}

async function carregarJSON<T>(arquivo: string): Promise<T> {
  const r = await fetch(import.meta.env.BASE_URL + 'data/' + arquivo);
  if (!r.ok) throw new Error(`falha ao carregar ${arquivo}`);
  return (await r.json()) as T;
}

export async function renderQuiz(): Promise<HTMLElement> {
  const sessao = lerSessao();
  if (!sessao || sessao.ordemCandidatos.length === 0) return criarErro('Sessão não encontrada');

  const container = el('div', { class: 'screen-quiz' });

  escolhido = null;
  travado = false;
  perguntas = [];

  let subtemas: SubtemaQuiz[];
  let trechosQuiz: TrechoQuizRef[];
  try {
    let listaPlanos: PlanoQuiz[];
    let dadosCriterios: { criterios: CriterioInfo[] };
    [subtemas, trechosQuiz, listaPlanos, avaliacoes, dadosCriterios] = await Promise.all([
      carregarJSON<SubtemaQuiz[]>('subtemas.json'),
      carregarJSON<TrechoQuizRef[]>('trechos_quiz.json'),
      carregarJSON<PlanoQuiz[]>('planos_cegos_quiz.json'),
      carregarJSON<AvaliacaoPublica[]>('avaliacoes_quiz.json'),
      carregarJSON<{ criterios: CriterioInfo[] }>('criterios.json'),
    ]);
    planos = new Map(listaPlanos.map((p) => [p.id, p]));
    criterios = dadosCriterios.criterios;
  } catch (e) {
    console.error(e);
    return criarErro('Não foi possível carregar o quiz. Tente de novo.');
  }

  // Reaproveita as perguntas da sessão (recarregar a página não muda o quiz) se ainda valem
  // Sessão de outra versão dos dados (outro total de perguntas, subtema removido, trecho inexistente) sorteia de novo
  const guardadas = sessao.perguntasQuiz ?? [];
  const valem = perguntasCompativeis(guardadas, subtemas, trechosQuiz) && guardadas.every((p) => p.opcoes.every((o) => planos.has(o)));
  if (valem) {
    perguntas = guardadas;
    respostasTemporarias = { ...sessao.respostasQuiz };
  } else {
    perguntas = sortearPerguntas(subtemas, trechosQuiz);
    respostasTemporarias = {};
    salvarSessao({ ...sessao, perguntasQuiz: perguntas, respostasQuiz: {}, finalizado: false });
  }

  if (perguntas.length === 0) return criarErro('Não foi possível carregar o quiz. Tente de novo.');

  // Qual passo estamos? A primeira pergunta ainda sem resposta
  currentStep = perguntas.findIndex((p) => !respostasTemporarias[p.id]);
  if (currentStep === -1) {
    setTimeout(() => navigate('#resultado'), 0);
    return container;
  }

  renderStep(container);
  return container;
}

function renderStep(container: HTMLElement, girar = false) {
  const pergunta = perguntas[currentStep];
  if (!pergunta) return;

  const total = perguntas.length;
  const emRevisao = escolhido !== null;

  const header = el(
    'div',
    { class: 'quiz-header' },
    el('div', { class: 'quiz-step-text eyebrow', texto: `Passo ${currentStep + 1} de ${total}` }),
    criarBarraDeProgresso(currentStep, total)
  );

  const questionTitle = el('h2', { class: 'quiz-question', texto: pergunta.enunciado });

  const optionsContainer = el('div', { class: 'quiz-options' });
  let verso: HTMLElement | null = null;
  let flipEscolhido: HTMLElement | null = null;
  for (const trechoId of pergunta.opcoes) {
    const plano = planos.get(trechoId);
    if (!plano) continue;

    const eEscolhido = trechoId === escolhido;
    const card = el('div', { class: `quiz-option-card${eEscolhido ? ' selecionada' : ''}` });
    const content = el(
      'div',
      { class: 'quiz-option-content', attrs: { role: 'button', tabindex: emRevisao ? '-1' : '0' } },
      el('p', { texto: `"${plano.texto_mascarado}"` })
    );
    if (!emRevisao) {
      const escolher = () => responder(pergunta.id, trechoId, container);
      content.addEventListener('click', escolher);
      content.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          escolher();
        }
      });
    }
    // Frente do card: o trecho. Depois do voto o card escolhido vira e mostra o verso
    const frente = el('div', { class: 'quiz-face quiz-frente' }, content);
    if (plano.contexto_mascarado) {
      frente.appendChild(criarContextoRecolhivel('Ver o parágrafo completo', plano.contexto_mascarado, plano.texto_mascarado));
    }
    const giro = el('div', { class: 'quiz-flip-giro' }, frente);
    const flip = el('div', { class: 'quiz-flip' }, giro);
    card.append(flip);
    if (eEscolhido) {
      verso = criarVerso(avaliacoes.filter((a) => a.trecho_id === trechoId), criterios);
      giro.append(verso);
      frente.setAttribute('inert', '');
      flipEscolhido = flip;
    }
    optionsContainer.appendChild(card);
  }

  const blocos: HTMLElement[] = [header, questionTitle, optionsContainer];
  const nav = el('div', { class: 'quiz-nav mobile-action-bar' });

  if (emRevisao) {
    // Depois do voto: o card escolhido vira e mostra os 5 critérios do trecho, sem dizer de quem é
    const ultima = currentStep === total - 1;
    const proxima = criarBotaoPill(ultima ? 'Ver resultado' : 'Próxima pergunta', 'primaria');
    proxima.addEventListener('click', () => avancar(container));
    nav.appendChild(proxima);
  } else {
    const escapeBtn = criarBotaoPill('Nenhuma das opções / Pular', 'secundaria');
    escapeBtn.classList.add('quiz-escape-btn');
    escapeBtn.addEventListener('click', () => pular(pergunta.id, container));
    nav.appendChild(escapeBtn);

    if (currentStep > 0) {
      const btnVoltar = criarBotaoPill('Voltar', 'secundaria');
      btnVoltar.classList.add('quiz-back-btn');
      btnVoltar.setAttribute('aria-label', 'Voltar para pergunta anterior');
      btnVoltar.prepend(criarIcone('voltar'));
      btnVoltar.addEventListener('click', () => {
        currentStep--;
        travado = false;
        renderStep(container);
      });
      nav.appendChild(btnVoltar);
    }
  }
  blocos.push(nav);

  container.replaceChildren(...blocos);

  if (girar && verso && flipEscolhido) {
    // Já estava na tela: só vira o card (sem refazer a entrada dos blocos) e leva o foco ao verso
    const alvo = flipEscolhido;
    const rotulo = verso;
    requestAnimationFrame(() => requestAnimationFrame(() => alvo.classList.add('virado')));
    rotulo.focus({ preventScroll: true });
    rotulo.scrollIntoView?.({ block: 'start', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    return;
  }
  if (flipEscolhido) flipEscolhido.classList.add('virado');

  // Entrada curta das telas de ação: sem blur, curta e só por tokens (movimento reduzido só troca opacidade)
  questionTitle.setAttribute('tabindex', '-1');
  if (currentStep > 0 || document.activeElement !== document.body) questionTitle.focus({ preventScroll: true });
  blocos.forEach((bloco, i) => {
    bloco.classList.add('entrada');
    bloco.style.setProperty('--i', String(i));
    requestAnimationFrame(() => requestAnimationFrame(() => bloco.classList.add('entrou')));
  });
}

/** Verso do card: fundo preto (tema escuro por tokens), os 5 critérios e o selo de concretude. Sem autor, partido nem apelido. */
function criarVerso(avaliacoesDoTrecho: AvaliacaoPublica[], criteriosInfo: CriterioInfo[]): HTMLElement {
  return el(
    'div',
    {
      class: 'quiz-face quiz-verso',
      data: { tema: 'escuro' },
      attrs: { role: 'group', tabindex: '-1', 'aria-label': 'Verso do card escolhido: critérios de viabilidade do trecho' },
    },
    criarSlideCriterios(avaliacoesDoTrecho, criteriosInfo)
  );
}

function gravar(perguntaId: string, resposta: string) {
  respostasTemporarias[perguntaId] = resposta;
  const sessao = lerSessao();
  if (sessao) salvarSessao({ ...sessao, respostasQuiz: respostasTemporarias });
}

function responder(perguntaId: string, trechoId: string, container: HTMLElement) {
  if (travado) return;
  travado = true;
  gravar(perguntaId, trechoId);
  escolhido = trechoId;
  renderStep(container, true);
}

function pular(perguntaId: string, container: HTMLElement) {
  if (travado) return;
  travado = true;
  gravar(perguntaId, RESPOSTA_PULAR);
  setTimeout(() => {
    travado = false;
    avancar(container);
  }, ATRASO_PULAR);
}

function avancar(container: HTMLElement) {
  escolhido = null;
  travado = false;
  currentStep++;
  if (currentStep >= perguntas.length) {
    navigate('#resultado');
    return;
  }
  renderStep(container);
}
