import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Gera src/assets/logos/onca-borda.svg a partir da logo oficial de fundo preto (ela não é alterada).
 * Decisão do dev (2026-09-29): tirar o quadro preto da tela inicial e pôr uma borda preta grossa em volta
 * da onça e do nome, com a silhueta preenchida de preto por baixo. Sem o preenchimento, as pintas, o olho
 * e o focinho, que na logo original são o próprio fundo preto aparecendo, virariam buracos transparentes.
 */

const ESPESSURA_BORDA = 30; // unidades do viewBox da logo (cerca de 7% da largura da onça)
const RESPIRO = 6;
// Nariz: liga a ponta do amarelo, o canto do focinho e o topo da presa e preenche de preto por baixo.
// Coordenadas no espaço da logo oficial (viewBox 0 0 1156 645).
const PONTOS_NARIZ: [number, number][] = [
  [745, 378], // onde o amarelo encontra o topo do focinho
  [818, 376], // ponta do amarelo
  [830, 412],
  [826, 418], // topo da presa
  [797, 448], // lado de dentro da presa
  [783, 434], // canto direito do focinho
  [768, 426],
  [752, 412],
  [743, 395],
];

interface Caixa { x0: number; y0: number; x1: number; y1: number }

function subcaminhos(d: string): string[] {
  return d.split(/(?=M\s)/).map((s) => s.trim()).filter(Boolean);
}

function caixaDe(sub: string): Caixa {
  const nums = (sub.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
  const xs: number[] = [];
  const ys: number[] = [];
  for (let i = 0; i + 1 < nums.length; i += 2) {
    xs.push(nums[i]!);
    ys.push(nums[i + 1]!);
  }
  return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
}

function dentro(a: Caixa, b: Caixa): boolean {
  return a !== b && a.x0 >= b.x0 && a.y0 >= b.y0 && a.x1 <= b.x1 && a.y1 <= b.y1;
}

/** Contornos externos: descarta subcaminhos que estão dentro de outro (miolos de letras, pintas, narinas). */
function externos(d: string): { sub: string; caixa: Caixa }[] {
  const itens = subcaminhos(d).map((sub) => ({ sub, caixa: caixaDe(sub) }));
  return itens.filter((a) => !itens.some((b) => dentro(a.caixa, b.caixa)));
}

export function gerarOncaBorda(origem: string): string {
  const svg = fs.readFileSync(origem, 'utf8');
  const cabecalho = svg.match(/viewBox="0 0 (\d+) (\d+)"/);
  if (!cabecalho) throw new Error('viewBox não encontrado na logo oficial');
  const larguraTela = Number(cabecalho[1]);
  const alturaTela = Number(cabecalho[2]);

  const caminhos = [...svg.matchAll(/<path fill="(#[0-9a-fA-F]{6})" opacity="1.00" d=" ([^"]+)"><\/path>/g)].map(
    (m) => ({ cor: m[1]!.toLowerCase(), d: m[2]!.trim() })
  );

  // 1) sem o quadro: tira o subcaminho que é a tela inteira
  const quadro = `M 0.00 0.00 L ${larguraTela}.00 0.00 L ${larguraTela}.00 ${alturaTela}.00 L 0.00 ${alturaTela}.00 L 0.00 0.00`;
  const pintados = caminhos.map((c) => ({
    cor: c.cor,
    d: c.d.startsWith(quadro) ? c.d.slice(quadro.length).trim() : c.d,
  }));

  // 2) silhueta: contornos externos de tudo que tem cor (amarelo, branco, cinza)
  const silhueta = pintados
    .filter((c) => c.cor !== '#000000')
    .flatMap((c) => externos(c.d));
  const caixa: Caixa = {
    x0: Math.min(...silhueta.map((s) => s.caixa.x0)),
    y0: Math.min(...silhueta.map((s) => s.caixa.y0)),
    x1: Math.max(...silhueta.map((s) => s.caixa.x1)),
    y1: Math.max(...silhueta.map((s) => s.caixa.y1)),
  };
  const margem = ESPESSURA_BORDA / 2 + RESPIRO;
  const vx = Math.floor(caixa.x0 - margem);
  const vy = Math.floor(caixa.y0 - margem);
  const vw = Math.ceil(caixa.x1 - caixa.x0 + margem * 2);
  const vh = Math.ceil(caixa.y1 - caixa.y0 + margem * 2);

  const borda = silhueta.map((s) => s.sub).join(' ');
  const corpo = pintados.map((c) => `<path fill="${c.cor}" d=" ${c.d}"/>`).join('\n');

  const nariz = 'M ' + PONTOS_NARIZ.map(([x, y]) => `${x} ${y}`).join(' L ') + ' Z';

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vx} ${vy} ${vw} ${vh}" role="img" aria-label="Onça-pintada do Missão">`,
    `<!-- Derivada da logo oficial missao-logo-vertical-fundo-preto.svg por scripts/gerar-onca-borda.ts. Não editar à mão. -->`,
    `<path fill="#000000" stroke="#000000" stroke-width="${ESPESSURA_BORDA}" stroke-linejoin="round" stroke-linecap="round" d="${borda}"/>`,
    `<path fill="#000000" stroke="#000000" stroke-width="${ESPESSURA_BORDA}" stroke-linejoin="round" d="${nariz}"/>`,
    corpo,
    `</svg>`,
    '',
  ].join('\n');
}

if (process.env.VITEST !== 'true' && process.env.NODE_ENV !== 'test') {
  const logos = path.join(__dirname, '../src/assets/logos');
  const saida = gerarOncaBorda(path.join(logos, 'missao-logo-vertical-fundo-preto.svg'));
  fs.writeFileSync(path.join(logos, 'onca-borda.svg'), saida);
  console.log('onca-borda.svg gerado');
}
