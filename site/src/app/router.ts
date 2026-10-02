import { renderInicio } from '../screens/inicio/index';
import { renderTesteCego } from '../screens/teste-cego/index';
import { renderRevelacao } from '../screens/revelacao/index';
import { renderQuiz } from '../screens/quiz/index';
import { renderResultado } from '../screens/resultado/index';
import { renderCompartilhar } from '../screens/resultado/compartilhar';
import { renderComparador } from '../screens/comparador/index';
import { renderMetodo } from '../screens/metodo/index';
import { renderParana } from '../screens/parana/index';
import { revelarBlocos } from '../motion/entrada-de-bloco';
import { iniciarFrasePresa } from '../motion/frase-presa';
import { atualizarNavegacao } from './cabecalho';
import { lerSessao } from '../state/sessao-storage';
import { guardaDeRota } from '../core/jornada';
import { mostrarAviso } from '../ui/toast';
import { iniciarTroca, type Troca } from '../motion/troca';
import { ultimoClique, consumirClique } from '../motion/clique';

type Tema = 'claro' | 'escuro';

/** Telas de emoção são escuras e se movem; telas de ação são claras e quase paradas. */
const TEMA_POR_TELA: Record<string, Tema> = {
  inicio: 'escuro',
  revelacao: 'escuro',
  resultado: 'escuro',
  compartilhar: 'escuro',
  'teste-cego': 'claro',
  quiz: 'claro',
  comparador: 'claro',
  metodo: 'claro',
  parana: 'claro',
};

let geracao = 0;
let limparFrase: (() => void) | null = null;
let trocaAtiva: Troca | null = null;
let primeiraTela = true;

export function initRouter() {
  window.addEventListener('hashchange', () => {
    navigate(window.location.hash || '#inicio');
  });

  // Trigger on load
  navigate(window.location.hash || '#inicio');
}

function montar(root: HTMLElement, tela: HTMLElement, path: string) {
  root.appendChild(tela);
  revelarBlocos(tela);
  const frase = tela.querySelector<HTMLElement>('.frase-presa');
  if (frase) limparFrase = iniciarFrasePresa(frase);

  // Foco no título da nova tela, para leitor de tela e teclado
  const titulo = tela.querySelector<HTMLElement>('h1, h2');
  if (titulo && path !== 'inicio') {
    titulo.setAttribute('tabindex', '-1');
    titulo.focus({ preventScroll: true });
  }
}

export function navigate(hash: string) {
  const path = hash.replace('#', '') || 'inicio';
  const root = document.getElementById('router-view');
  if (!root) return;

  // A jornada é em ordem: quem tenta abrir uma etapa antes da hora vai para a que falta, com o motivo
  const guarda = guardaDeRota(path, lerSessao());
  if (!guarda.ok) {
    mostrarAviso(guarda.motivo);
    history.replaceState(null, '', `#${guarda.destino}`);
    navigate(`#${guarda.destino}`);
    return;
  }

  const minha = ++geracao;
  trocaAtiva?.cancelar();
  trocaAtiva = null;

  // Íris a partir do clique, só quando um clique de verdade provocou a troca (não na 1ª carga nem no voltar do navegador)
  const clique = primeiraTela ? null : ultimoClique();
  const temaDestino = TEMA_POR_TELA[path];
  const troca = clique && temaDestino ? iniciarTroca(clique, temaDestino) : null;
  primeiraTela = false;
  consumirClique();
  trocaAtiva = troca;

  // Tela síncrona ou assíncrona; descarta a resposta se o usuário já mudou de tela
  const entrar = (tela: HTMLElement | Promise<HTMLElement>) => {
    Promise.all([Promise.resolve(tela), troca ? troca.cobriu : Promise.resolve()]).then(([el]) => {
      if (minha !== geracao) return;
      if (troca) trocarConteudo(root, path);
      montar(root, el, path);
      troca?.revelar();
    });
  };

  // Sem íris, a troca de tema e de conteúdo é imediata
  if (!troca) trocarConteudo(root, path);

  switch (path) {
    case 'inicio':
      entrar(renderInicio());
      break;
    case 'teste-cego':
      entrar(renderTesteCego());
      break;
    case 'revelacao':
      entrar(renderRevelacao());
      break;
    case 'quiz':
      entrar(renderQuiz());
      break;
    case 'resultado':
      entrar(renderResultado());
      break;
    case 'compartilhar':
      entrar(renderCompartilhar());
      break;
    case 'comparador':
      entrar(renderComparador());
      break;
    case 'metodo':
      entrar(renderMetodo());
      break;
    case 'parana':
      entrar(renderParana());
      break;
    default:
      troca?.cancelar();
      window.location.hash = '#inicio';
      break;
  }
}

/** Esvazia a tela, aplica o tema e volta ao topo. Acontece no instante da troca (por baixo da íris, se houver). */
function trocarConteudo(root: HTMLElement, path: string) {
  limparFrase?.();
  limparFrase = null;
  root.replaceChildren();
  const tema = TEMA_POR_TELA[path];
  if (tema) {
    document.body.dataset.tema = tema;
    document.body.dataset.tela = path;
  }
  atualizarNavegacao(path);
  window.scrollTo(0, 0);
  // No celular em pé o scroll de algumas telas fica no #app
  const app = document.getElementById('app');
  if (app) app.scrollTop = 0;
  // Sincroniza a URL com a tela exibida (issue 330): navigate direto não
  // dispara hashchange, então o hash ficava preso na tela anterior e os
  // links href="#inicio" paravam de funcionar. pushState não dispara
  // hashchange (sem loop); o Voltar do navegador volta à tela anterior.
  // Quando navigate veio do handler de hashchange ou do guarda
  // (replaceState), o hash já está certo e nada é feito.
  const esperado = `#${path}`;
  if (window.location.hash !== esperado) history.pushState(null, '', esperado);
}
