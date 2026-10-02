const SVG_NS = 'http://www.w3.org/2000/svg';

type Forma =
  | { t: 'path'; d: string }
  | { t: 'circle'; cx: string; cy: string; r: string };

const ICONES = {
  seta: [{ t: 'path', d: 'M5 12h14M13 6l6 6-6 6' }],
  voltar: [{ t: 'path', d: 'M19 12H5M11 6l-6 6 6 6' }],
  fechar: [{ t: 'path', d: 'M6 6l12 12M18 6L6 18' }],
  aviso: [
    { t: 'path', d: 'M12 3l10 18H2L12 3z' },
    { t: 'path', d: 'M12 10v5M12 18v.01' },
  ],
  check: [{ t: 'path', d: 'M4 12l5 5L20 6' }],
  cadeado: [
    { t: 'path', d: 'M6 11h12v10H6z' },
    { t: 'path', d: 'M8.5 11V8a3.5 3.5 0 017 0v3' },
  ],
  meio: [
    { t: 'circle', cx: '12', cy: '12', r: '9' },
    { t: 'path', d: 'M8 12h8' },
  ],
  nao: [
    { t: 'circle', cx: '12', cy: '12', r: '9' },
    { t: 'path', d: 'M9 9l6 6M15 9l-6 6' },
  ],
  duvida: [
    { t: 'circle', cx: '12', cy: '12', r: '9' },
    { t: 'path', d: 'M9.5 9.5a2.5 2.5 0 015 0c0 1.5-2.5 2-2.5 4M12 17v.01' },
  ],
  busca: [
    { t: 'circle', cx: '11', cy: '11', r: '7' },
    { t: 'path', d: 'M20 20l-4-4' },
  ],
  pino: [
    { t: 'path', d: 'M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11z' },
    { t: 'circle', cx: '12', cy: '10', r: '2.5' },
  ],
  casa: [{ t: 'path', d: 'M3 11l9-8 9 8M5 9.5V20h5v-6h4v6h5V9.5' }],
  menu: [{ t: 'path', d: 'M4 6h16M4 12h16M4 18h16' }],
} satisfies Record<string, Forma[]>;

export type NomeIcone = keyof typeof ICONES;

/** Ícone decorativo montado por DOM (sem emoji). O sentido vem sempre do texto ao lado. */
export function criarIcone(nome: NomeIcone, extra = ''): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.setAttribute('class', `icone icone-${nome} ${extra}`.trim());
  for (const f of ICONES[nome] as readonly Forma[]) {
    if (f.t === 'path') {
      const p = document.createElementNS(SVG_NS, 'path');
      p.setAttribute('d', f.d);
      svg.appendChild(p);
    } else {
      const c = document.createElementNS(SVG_NS, 'circle');
      c.setAttribute('cx', f.cx);
      c.setAttribute('cy', f.cy);
      c.setAttribute('r', f.r);
      svg.appendChild(c);
    }
  }
  return svg;
}
