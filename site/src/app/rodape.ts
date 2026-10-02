import { el } from '../ui/dom';
import { criarLogo } from '../ui/logo';
import { criarIcone } from '../ui/icone';
import { AVISO_AUTORIA } from '../ui/aviso';
import { LINKS_NAV } from './cabecalho';

export function criarRodape(): HTMLElement {
  const marca = el(
    'a',
    { class: 'app-marca', attrs: { href: '#inicio', 'aria-label': 'Missão Quiz, ir para o início' } },
    criarLogo('escuro')
  );

  const texto = el(
    'div',
    { class: 'pilha' },
    el('p', { class: 'app-footer-aviso', texto: AVISO_AUTORIA }),
    el('p', {
      class: 'app-footer-sdm',
      texto:
        'Construído com o SDM Sled-Development-Method, pela SlyvSolutions. Contato: (41) 99946-7052.',
    }),
    el(
      'nav',
      { class: 'app-footer-links', attrs: { 'aria-label': 'Rodapé' } },
      el('a', { class: 'link-bloqueavel', texto: 'Comparador', data: { nav: 'comparador' } }, criarIcone('cadeado', 'icone-pequeno')),
      ...LINKS_NAV.map((l) => el('a', { texto: l.rotulo, attrs: { href: l.hash } })),
      el('a', {
        texto: 'Ver no TSE',
        attrs: { href: 'https://divulgacandcontas.tse.jus.br', target: '_blank', rel: 'noopener' },
      })
    )
  );

  return el('footer', { class: 'app-footer' }, el('div', { class: 'conteudo app-footer-interno' }, marca, texto));
}
