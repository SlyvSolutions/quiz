import { el } from '../../ui/dom';
import { criarEstadoWizard, TOTAL_SLIDES } from './wizard-state';
import { criarSlides } from './slides';
import { prefersReducedMotion } from '../../motion/reduced-motion';
import { CANDIDATOS, NOMES_CRITERIOS, carregarDados, escolherExemplo, sortearIndice, type ExemploSorteado } from './exemplo-sorteio';
import { criarSlideCriterios } from '../../ui/slide-criterios';

const NOMES = ['provocação', 'como funciona', 'critérios', 'virada missão', 'começar'];

export interface AcoesWizard {
  aoComecar?(destino: string): void;
  aoPular?(): void;
}

export function criarWizard(salvo = 0, acoes: AcoesWizard = {}): HTMLElement {
  const estado = criarEstadoWizard(salvo);
  const deck = el('div', {
    class: 'inicio-wizard',
    attrs: { role: 'region', 'aria-roledescription': 'carrossel', 'aria-label': 'Apresentação do Missão Quiz' },
  });
  // Fixo pro revelarBlocos do router (seletor pula [data-fixo]): o deck tem a própria entrada
  const trilho = el('div', { class: 'wizard-trilho', data: { fixo: '1' } });
  const slides = criarSlides({
    sessao: null,
    aoAvancar: () => irPara(estado.atual + 1),
    aoPular: () => acoes.aoPular?.(),
    aoComecar: (destino) => acoes.aoComecar?.(destino),
  });
  trilho.append(...slides);

  const dots = el('div', { class: 'wizard-dots', attrs: { role: 'tablist', 'aria-label': 'Slides' } });
  NOMES.forEach((nome, i) => {
    const d = el('button', {
      class: 'wizard-dot', attrs: { type: 'button', role: 'tab', 'data-dot': String(i + 1), 'aria-label': `Ir para slide ${i + 1}: ${nome}` },
    }, String(i + 1));
    d.addEventListener('click', () => irPara(i));
    dots.appendChild(d);
  });

  const voltar = el('button', { class: 'wizard-seta', attrs: { type: 'button', 'data-nav': 'anterior', 'aria-label': 'Slide anterior' } }, '←');
  voltar.addEventListener('click', () => irPara(estado.atual - 1));
  const avancar = el('button', { class: 'wizard-seta', attrs: { type: 'button', 'data-nav': 'proximo', 'aria-label': 'Próximo slide' } }, '→');
  avancar.addEventListener('click', () => irPara(estado.atual + 1));
  const pular = el('button', { class: 'wizard-pular', attrs: { type: 'button' }, data: { fixo: '1' } }, 'Pular introdução →');
  pular.addEventListener('click', () => acoes.aoPular?.());
  const nav = el('div', { class: 'wizard-nav', data: { fixo: '1' } }, voltar, dots, avancar);

  function pintar(): void {
    slides.forEach((s, i) => {
      const visivel = i === estado.atual;
      s.setAttribute('aria-hidden', String(!visivel));
      s.classList.toggle('visivel', visivel);
    });
    dots.querySelectorAll('[data-dot]').forEach((d, i) => {
      (d as HTMLElement).setAttribute('aria-selected', String(i === estado.atual));
    });
    voltar.toggleAttribute('disabled', estado.atual === 0);
    avancar.toggleAttribute('disabled', estado.atual === TOTAL_SLIDES - 1);
    deck.dataset.tema = slides[estado.atual]?.dataset.tema ?? '';
    if (!prefersReducedMotion()) {
      const atual = slides[estado.atual]!;
      atual.classList.remove('wizard-entrando');
      void atual.offsetWidth;
      atual.classList.add('wizard-entrando');
    }
    const titulo = slides[estado.atual]!.querySelector('h1, h2');
    (titulo as HTMLElement | null)?.setAttribute('tabindex', '-1');
    (titulo as HTMLElement | null)?.focus({ preventScroll: true });
  }

  function irPara(i: number): void {
    estado.irPara(i);
    pintar();
  }

  // Teclado no deck
  deck.addEventListener('keydown', (e) => {
    if ((e as KeyboardEvent).key === 'ArrowRight') irPara(estado.atual + 1);
    if ((e as KeyboardEvent).key === 'ArrowLeft') irPara(estado.atual - 1);
    if ((e as KeyboardEvent).key === 'Home') irPara(0);
    if ((e as KeyboardEvent).key === 'End') irPara(TOTAL_SLIDES - 1);
  });

  trilho.querySelectorAll('details').forEach((d) => {
    d.addEventListener('toggle', () => {
      if (!(d as HTMLDetailsElement).open) return;
      trilho.querySelectorAll('details').forEach((o) => {
        if (o !== d) (o as HTMLDetailsElement).open = false;
      });
    });
  });

  // Sorteio do exemplo + overlay metodológico do slide 3
  inicializarSorteio(trilho);
  // Overlay do sorteio da ordem (slide 2): mesmo efeito de slide do slide 3
  inicializarJornada(trilho);

  deck.append(pular, trilho, nav);
  pintar();
  return deck;
}

/** Painel metodológico inline do slide 2: toggle pelo botão "COMO FUNCIONA O MÉTODO". */
function inicializarJornada(raiz: HTMLElement): void {
  const btnMetodo = raiz.querySelector<HTMLButtonElement>('#btn-jornada-metodo');
  const metodo = raiz.querySelector<HTMLElement>('#jornada-metodo');
  if (!btnMetodo || !metodo) return;
  btnMetodo.addEventListener('click', () => {
    const abrindo = metodo.hasAttribute('hidden');
    if (abrindo) {
      metodo.removeAttribute('hidden');
      btnMetodo.setAttribute('aria-expanded', 'true');
    } else {
      metodo.setAttribute('hidden', '');
      btnMetodo.setAttribute('aria-expanded', 'false');
    }
  });

  // Duelo lista-detalhe como o do slide 3: abrir a linha preenche o aside
  const lista = raiz.querySelector<HTMLElement>('#jornada-lista');
  const detalhe = raiz.querySelector<HTMLElement>('#jornada-detalhe');
  const dTag = raiz.querySelector<HTMLElement>('#jornada-detalhe-tag');
  const dNome = raiz.querySelector<HTMLElement>('#jornada-detalhe-nome');
  const dCorpo = raiz.querySelector<HTMLElement>('#jornada-detalhe-corpo');
  const dCodigo = raiz.querySelector<HTMLElement>('#jornada-detalhe-codigo');
  const dMeta = raiz.querySelector<HTMLElement>('#jornada-detalhe-meta');
  const btnDetalheFechar = raiz.querySelector<HTMLButtonElement>('#btn-jornada-detalhe-fechar');
  if (!lista || !detalhe || !dTag || !dNome || !dCorpo || !dCodigo || !dMeta || !btnDetalheFechar) return;
  const texto = (raizEl: HTMLElement, seletor: string): string =>
    raizEl.querySelector(seletor)?.textContent ?? '';
  function mostrar(d: HTMLDetailsElement): void {
    dTag!.textContent = texto(d, '.wizard-s2-tag');
    dNome!.textContent = texto(d, '.wizard-nome');
    dCorpo!.textContent = texto(d, '.contexto-corpo > p');
    dCodigo!.textContent = texto(d, '.wizard-s2-codigo-linha');
    dMeta!.textContent = texto(d, '.wizard-s2-meta-texto');
    detalhe!.hidden = false;
    if (!prefersReducedMotion()) {
      detalhe!.classList.remove('detalhe-entrando');
      void detalhe!.offsetWidth;
      detalhe!.classList.add('detalhe-entrando');
    }
  }
  lista.querySelectorAll('details').forEach((d) => {
    d.addEventListener('toggle', () => {
      if ((d as HTMLDetailsElement).open) mostrar(d as HTMLDetailsElement);
    });
  });
  btnDetalheFechar.addEventListener('click', () => {
    detalhe.hidden = true;
    lista.querySelectorAll('details').forEach((o) => {
      (o as HTMLDetailsElement).open = false;
    });
  });
}
/** Sorteio de demonstração: trecho sorteado e as 5 avaliações dele (veredito, justificativa, fonte e concretude). */
function inicializarSorteio(raiz: HTMLElement): void {
  const nome = raiz.querySelector<HTMLElement>('#sorteio-nome');
  const trechoEl = raiz.querySelector<HTMLElement>('#sorteio-trecho');
  const refEl = raiz.querySelector<HTMLElement>('#sorteio-ref');
  const offlineEl = raiz.querySelector<HTMLElement>('#sorteio-offline');
  const btnSortear = raiz.querySelector<HTMLButtonElement>('#btn-sortear-outro');
  if (!nome || !trechoEl || !refEl || !offlineEl || !btnSortear) return;

  let cache: Promise<{ trechos: ExemploSorteado['trecho'][]; avaliacoes: ExemploSorteado['avaliacoes'] } | null> | null = null;
  const criteriosEl = raiz.querySelector<HTMLElement>('#sorteio-criterios');
  const criterios = Object.entries(NOMES_CRITERIOS).map(([id, nome]) => ({ id, nome }));
  let sorteando = false;
  // Os dados baixam uma vez; o sorteio é novo a cada vez (sortear de verdade)
  const dados = () => (cache ??= carregarDados());

  function mostrar(ex: ExemploSorteado | null): void {
    // Sem rede/dado: aviso neutro, sem exemplo fixo de candidato nenhum
    if (!ex) {
      nome!.textContent = '…';
      trechoEl!.textContent = '…';
      refEl!.textContent = '';
      offlineEl!.hidden = false;
      criteriosEl?.replaceChildren();
      return;
    }
    offlineEl!.hidden = true;
    nome!.textContent = ex.nomeCandidato;
    trechoEl!.textContent = `"${ex.trecho.texto_literal}"`;
    refEl!.textContent = `${ex.trecho.arquivo}, linhas ${ex.trecho.linha_inicio}–${ex.trecho.linha_fim}`;
    criteriosEl?.replaceChildren(criarSlideCriterios(ex.avaliacoes, criterios, { original: true }));
  }

  function assentar(): void {
    sorteando = false;
    void dados()
      .then((d) => mostrar(d ? escolherExemplo(d.trechos, Math.random, d.avaliacoes) : null))
      .catch(() => mostrar(null));
  }

  function sortear(): void {
    if (sorteando) return;
    if (prefersReducedMotion()) {
      assentar();
      return;
    }
    sorteando = true;
    let trocas = 0;
    const papel = window.setInterval(() => {
      nome!.textContent = CANDIDATOS[sortearIndice(CANDIDATOS.length)]!.nome.toUpperCase();
      trocas += 1;
      if (trocas >= 12) {
        window.clearInterval(papel);
        assentar();
      }
    }, 90);
  }

  btnSortear.addEventListener('click', sortear);
  sortear();
}