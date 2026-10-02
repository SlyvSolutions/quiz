import logoParaFundoClaro from '../assets/logos/missao-logo-vertical-texto-preto.svg';
import logoParaFundoEscuro from '../assets/logos/missao-logo-vertical-fundo-preto.svg';
import oncaComBorda from '../assets/logos/onca-borda.svg';
import githubMarkSvg from '../assets/logos/github-mark.svg?raw';
import { el } from './dom';

/** Logos oficiais, sem redesenhar nem recolorir. Claro usa a de texto preto; escuro, a de fundo preto. */
export function criarLogo(fundo: 'claro' | 'escuro', alt = 'Missão'): HTMLImageElement {
  return el('img', {
    class: `logo-${fundo}`,
    attrs: {
      src: fundo === 'claro' ? logoParaFundoClaro : logoParaFundoEscuro,
      alt,
      decoding: 'async',
    },
  });
}

/** Onça sem o quadro preto, com borda preta grossa e silhueta preenchida (derivada da logo oficial). Funciona em qualquer fundo. */
export function criarOnca(alt = 'Onça-pintada do Missão'): HTMLImageElement {
  return el('img', { class: 'onca-borda', attrs: { src: oncaComBorda, alt, decoding: 'async' } });
}


/**
 * Marca do GitHub (Octicon "mark-github", pacote @primer/octicons, licença MIT), sem alterar a forma.
 * Entra como SVG no DOM (não como imagem) para herdar a cor do texto (currentColor) nos temas claro e escuro.
 * Só identifica o repositório; não indica apoio do GitHub ao projeto.
 */
export function criarLogoGithub(extra = ''): SVGElement {
  const doc = new DOMParser().parseFromString(githubMarkSvg, 'image/svg+xml');
  const svg = document.importNode(doc.documentElement, true) as unknown as SVGElement;
  svg.setAttribute('class', `logo-github ${extra}`.trim());
  return svg;
}
