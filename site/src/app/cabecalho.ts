import { el } from '../ui/dom';
import { criarLogo } from '../ui/logo';
import { criarIcone } from '../ui/icone';
import { mostrarAviso } from '../ui/toast';
import { abrirSlidePanel } from '../ui/slide-panel';
import { lerSessao } from '../state/sessao-storage';
import { estadoDaTrilha, liberada, type ItemDaTrilha } from '../core/jornada';

export const NOME_COMPLETO_PARANA = 'Candidatos da Missão no PR';

/** Páginas de consulta, abertas o tempo todo. O Comparador não entra aqui: só abre no fim da jornada. */
export const LINKS_NAV: { hash: string; rotulo: string; rotuloCompleto?: string }[] = [
  { hash: '#metodo', rotulo: 'Método e Fontes' },
  { hash: '#parana', rotulo: 'Candidatos PR', rotuloCompleto: NOME_COMPLETO_PARANA },
];

/** Itens do menu celular: rótulos longos, um por linha. */
const ITENS_MENU: { hash: string; rotulo: string }[] = [
  { hash: '#inicio', rotulo: 'Início' },
  { hash: '#metodo', rotulo: 'Método' },
  { hash: '#parana', rotulo: NOME_COMPLETO_PARANA },
];

function rotaAtual(): string {
  if (window.location.hash) return window.location.hash;
  const tela = document.body.dataset.tela;
  return tela ? `#${tela}` : '#inicio';
}

export function criarCabecalho(): HTMLElement {
  const marca = el(
    'a',
    { class: 'app-marca', attrs: { href: '#inicio', 'aria-label': 'Missão Quiz, ir para o início' } },
    criarLogo('claro'),
    criarLogo('escuro')
  );

  const inicio = el(
    'a',
    { class: 'app-inicio', attrs: { href: '#inicio', 'aria-label': 'Início', title: 'Início' } },
    criarIcone('casa')
  );

  const trilha = el(
    'nav',
    { class: 'trilha', attrs: { 'aria-label': 'Sua jornada' } },
    el('ol', { class: 'trilha-lista' })
  );

  const nav = el(
    'nav',
    { class: 'app-nav', attrs: { 'aria-label': 'Consulta' } },
    ...LINKS_NAV.map((l) =>
      el(
        'a',
        {
          texto: l.rotulo,
          attrs: {
            href: l.hash,
            ...(l.rotuloCompleto ? { 'aria-label': l.rotuloCompleto, title: l.rotuloCompleto } : {}),
          },
        }
      )
    )
  );

  const menu = el(
    'button',
    {
      class: 'app-menu',
      attrs: { type: 'button', 'aria-label': 'Menu', 'aria-haspopup': 'dialog', 'aria-expanded': 'false' },
    },
    criarIcone('menu')
  );
  menu.addEventListener('click', () => abrirMenu(menu));

  return el(
    'header',
    { class: 'app-header' },
    el('div', { class: 'conteudo app-header-interno' }, marca, inicio, trilha, nav, menu)
  );
}

/** Abre o menu celular num painel lateral com os 3 destinos em coluna. */
function abrirMenu(botao: HTMLElement): void {
  if (document.querySelector('.ui-slide-panel')) return;
  const atual = rotaAtual();
  const lista = el(
    'nav',
    { class: 'app-menu-nav', attrs: { 'aria-label': 'Menu' } },
    ...ITENS_MENU.map((item) =>
      el(
        'a',
        {
          class: 'app-menu-link',
          texto: item.rotulo,
          attrs: { href: item.hash, ...(item.hash === atual ? { 'aria-current': 'page' } : {}) },
        }
      )
    )
  );
  const { fechar, panel } = abrirSlidePanel('Menu', lista);
  botao.setAttribute('aria-expanded', 'true');
  const fecharEVoltar = () => {
    botao.setAttribute('aria-expanded', 'false');
    fechar();
  };
  lista.querySelectorAll('a').forEach((a) => a.addEventListener('click', fecharEVoltar));
  const obs = new MutationObserver(() => {
    if (!document.body.contains(panel)) {
      botao.setAttribute('aria-expanded', 'false');
      obs.disconnect();
    }
  });
  obs.observe(document.body, { childList: true });
}

function criarItem(item: ItemDaTrilha, recemLiberado: boolean): HTMLElement {
  const bloqueado = item.estado === 'bloqueado';
  const rotuloAcessivel = `${item.numero}. ${item.rotulo}${
    item.estado === 'feito' ? ', concluído' : bloqueado ? ', bloqueado' : ''
  }`;

  const numero = el('span', { class: 'trilha-num', attrs: { 'aria-hidden': 'true' } });
  if (item.estado === 'feito') numero.appendChild(criarIcone('check', 'icone-pequeno'));
  else if (bloqueado) numero.appendChild(criarIcone('cadeado', 'icone-pequeno'));
  else numero.append(String(item.numero));

  const conteudo = [numero, el('span', { class: 'trilha-rotulo', texto: item.rotulo })];

  const link = bloqueado
    ? el(
        'button',
        { class: 'trilha-link', attrs: { type: 'button', 'aria-disabled': 'true', 'aria-label': rotuloAcessivel, title: item.motivo ?? '' } },
        ...conteudo
      )
    : el('a', { class: 'trilha-link', attrs: { href: item.href, 'aria-label': rotuloAcessivel } }, ...conteudo);

  if (bloqueado && item.motivo) {
    const motivo = item.motivo;
    link.addEventListener('click', () => mostrarAviso(motivo));
  }
  if (item.estado === 'atual') link.setAttribute('aria-current', 'step');

  return el('li', { class: `trilha-item estado-${item.estado}${recemLiberado ? ' recem-liberado' : ''}` }, link);
}

/**
 * Atualiza a trilha da jornada, a marca da página atual e o link do Comparador no rodapé.
 * Chamada pelo router a cada troca de tela; tolera a ausência de cabeçalho e rodapé (testes).
 */
export function atualizarNavegacao(rota: string): void {
  const sessao = lerSessao();
  const itens = estadoDaTrilha(sessao, rota);
  const lista = document.querySelector('.trilha-lista');
  // No resultado, o Comparador acabou de abrir: ele pulsa uma vez para chamar atenção
  lista?.replaceChildren(...itens.map((i) => criarItem(i, i.id === 'comparador' && rota === 'resultado' && i.estado !== 'bloqueado')));

  document.querySelectorAll<HTMLAnchorElement>('.app-nav a').forEach((a) => {
    if (a.getAttribute('href') === `#${rota}`) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });

  const aberto = liberada('comparador', sessao);
  document.querySelectorAll<HTMLElement>('[data-nav="comparador"]').forEach((a) => {
    if (aberto) {
      a.setAttribute('href', '#comparador');
      a.removeAttribute('aria-disabled');
      a.removeAttribute('title');
    } else {
      a.removeAttribute('href');
      a.setAttribute('aria-disabled', 'true');
      a.setAttribute('title', 'Abre quando você completa o teste');
    }
  });
}
