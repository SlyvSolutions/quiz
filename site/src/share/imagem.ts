/**
 * Imagem do resultado, desenhada direto num canvas.
 * O texto é posicionado com textBaseline "middle", então fica centralizado igual em qualquer navegador
 * (bibliotecas que "fotografam" o HTML erram a posição do texto em alguns aparelhos). As cores e os textos
 * vêm dos próprios elementos da tela, para o PNG ficar igual ao que a pessoa vê.
 */

const FAMILIA = '"Helvetica Neue", Helvetica, Arial, sans-serif';

/** Fonte do canvas: peso e tamanho em unidades do desenho (o canvas tem 1080 de largura). */
const fonte = (peso: number, tamanho: number): string => `${peso} ${tamanho}px ${FAMILIA}`;

/**
 * Desenha um SVG (arquivo ou data URI) num canvas e devolve um PNG em data URI.
 * Os logos só têm viewBox, sem largura e altura: o tamanho é dado aqui, a partir do viewBox.
 */
export async function rasterizarSvg(url: string, larguraPx = 1000): Promise<string | null> {
  try {
    const texto = await (await fetch(url)).text();
    const doc = new DOMParser().parseFromString(texto, 'image/svg+xml');
    const svg = doc.documentElement;
    const vb = (svg.getAttribute('viewBox') ?? '').split(/[\s,]+/).map(Number);
    if (vb.length !== 4 || !(vb[2]! > 0) || !(vb[3]! > 0)) return null;
    const altura = Math.round((larguraPx * vb[3]!) / vb[2]!);
    svg.setAttribute('width', String(larguraPx));
    svg.setAttribute('height', String(altura));
    const blobUrl = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' }));
    try {
      const img = new Image();
      img.src = blobUrl;
      await img.decode();
      const canvas = document.createElement('canvas');
      canvas.width = larguraPx;
      canvas.height = altura;
      canvas.getContext('2d')!.drawImage(img, 0, 0, larguraPx, altura);
      return canvas.toDataURL('image/png');
    } finally {
      URL.revokeObjectURL(blobUrl);
    }
  } catch (err) {
    console.error('Falha ao rasterizar SVG', err);
    return null;
  }
}

/** Quebra o texto em linhas que cabem em `max` (medido por `medir`). Uma palavra maior que `max` fica sozinha na linha. */
export function quebrarLinhas(medir: (t: string) => number, texto: string, max: number): string[] {
  const linhas: string[] = [];
  let atual = '';
  for (const palavra of texto.split(/\s+/).filter(Boolean)) {
    const tentativa = atual ? `${atual} ${palavra}` : palavra;
    if (atual && medir(tentativa) > max) {
      linhas.push(atual);
      atual = palavra;
    } else {
      atual = tentativa;
    }
  }
  if (atual) linhas.push(atual);
  return linhas;
}

/** Como quebrarLinhas, mas com duas linhas de tamanho parecido (evita uma palavra sozinha na segunda linha). */
export function quebrarEquilibrado(medir: (t: string) => number, texto: string, max: number): string[] {
  const linhas = quebrarLinhas(medir, texto, max);
  if (linhas.length !== 2) return linhas;
  const palavras = texto.split(/\s+/).filter(Boolean);
  let melhor = linhas;
  let menorMaior = Math.max(...linhas.map(medir));
  for (let i = 1; i < palavras.length; i++) {
    const par = [palavras.slice(0, i).join(' '), palavras.slice(i).join(' ')];
    const maior = Math.max(...par.map(medir));
    if (maior <= max && maior < menorMaior) {
      menorMaior = maior;
      melhor = par;
    }
  }
  return melhor;
}

function caminhoArredondado(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  const raio = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + raio, y);
  ctx.arcTo(x + w, y, x + w, y + h, raio);
  ctx.arcTo(x + w, y + h, x, y + h, raio);
  ctx.arcTo(x, y + h, x, y, raio);
  ctx.arcTo(x, y, x + w, y, raio);
  ctx.closePath();
}

async function carregarImagem(src: string): Promise<HTMLImageElement> {
  const img = new Image();
  img.src = src;
  await img.decode();
  return img;
}

const L = 1080;
const PAD = 80;
const BORDA = 6;
const RAIO = 56;
const LOGO_L = 380;
const LINHA_ALTURA = 112;
const LINHA_GAP = 20;

/** Gera o PNG do cartão de compartilhamento a partir da área `.comp-print-area`. Devolve null se falhar. */
export async function gerarBlobDeElemento(area: HTMLElement): Promise<Blob | null> {
  try {
    const q = (s: string) => area.querySelector<HTMLElement>(s);
    const estilo = (e: Element | null) => (e ? getComputedStyle(e) : null);
    const texto = (s: string) => (q(s)?.textContent ?? '').trim();

    const fundo = estilo(area)!.backgroundColor;
    const corBorda = estilo(area)!.borderTopColor;
    const corTitulo = estilo(q('.comp-title'))?.color ?? corBorda;
    const corAviso = estilo(q('.comp-aviso-print'))?.color ?? corBorda;
    const corRodape = estilo(q('.comp-print-footer'))?.color ?? corBorda;

    const logoSrc = q('.comp-logo img')?.getAttribute('src') ?? '';
    const logoPng = logoSrc ? await rasterizarSvg(logoSrc) : null;
    const logo = logoPng ? await carregarImagem(logoPng) : null;
    const logoA = logo ? Math.round((LOGO_L * logo.naturalHeight) / logo.naturalWidth) : 0;

    const linhas = Array.from(area.querySelectorAll<HTMLElement>('.comp-cand-row')).map((r) => ({
      nome: (r.querySelector('.comp-cand-nome')?.textContent ?? '').trim().toUpperCase(),
      pct: (r.querySelector('.comp-cand-pct')?.textContent ?? '').trim(),
      fundo: getComputedStyle(r).backgroundColor,
      cor: getComputedStyle(r).color,
    }));

    // Medição (num canvas descartável) antes de fixar a altura do cartão
    const medidor = document.createElement('canvas').getContext('2d')!;
    const medir = (fonte: string) => (t: string) => {
      medidor.font = fonte;
      return medidor.measureText(t).width;
    };
    const fonteTitulo = fonte(700, 58);
    const fonteAviso = fonte(400, 34);
    const largUtil = L - 2 * PAD;
    const titulo = quebrarEquilibrado(medir(fonteTitulo), texto('.comp-title').toUpperCase(), largUtil);
    const aviso = quebrarEquilibrado(medir(fonteAviso), texto('.comp-aviso-print'), largUtil);
    const rodapeLinha1 = 'Faça o seu teste em:';
    const rodapeLinha2 = (q('.comp-print-footer strong')?.textContent ?? '').trim();

    let altura = PAD;
    altura += (logo ? logoA + 56 : 0) + titulo.length * 70 + 36 + aviso.length * 50 + 52;
    altura += linhas.length * (LINHA_ALTURA + LINHA_GAP) - LINHA_GAP + 60;
    altura += 50 + 50 + PAD;

    const canvas = document.createElement('canvas');
    canvas.width = L;
    canvas.height = altura;
    const ctx = canvas.getContext('2d')!;

    // Fundo opaco por fora (cantos transparentes aparecem brancos em alguns apps) e o cartão arredondado por cima
    ctx.fillStyle = fundo;
    ctx.fillRect(0, 0, L, altura);
    // Cartão
    caminhoArredondado(ctx, 0, 0, L, altura, RAIO);
    ctx.fillStyle = fundo;
    ctx.fill();
    ctx.lineWidth = BORDA * 2;
    ctx.strokeStyle = corBorda;
    ctx.save();
    ctx.clip();
    caminhoArredondado(ctx, 0, 0, L, altura, RAIO);
    ctx.stroke();
    ctx.restore();

    ctx.textBaseline = 'middle';
    let y = PAD;

    if (logo) {
      ctx.drawImage(logo, (L - LOGO_L) / 2, y, LOGO_L, logoA);
      y += logoA + 56;
    }

    ctx.textAlign = 'center';
    ctx.font = fonteTitulo;
    ctx.fillStyle = corTitulo;
    for (const l of titulo) {
      ctx.fillText(l, L / 2, y + 35);
      y += 70;
    }
    y += 36;

    ctx.font = fonteAviso;
    ctx.fillStyle = corAviso;
    for (const l of aviso) {
      ctx.fillText(l, L / 2, y + 25);
      y += 50;
    }
    y += 52;

    for (const r of linhas) {
      caminhoArredondado(ctx, PAD, y, largUtil, LINHA_ALTURA, 32);
      ctx.fillStyle = r.fundo;
      ctx.fill();
      const meio = y + LINHA_ALTURA / 2;

      ctx.fillStyle = r.cor;
      ctx.textAlign = 'right';
      ctx.font = fonte(700, 60);
      const larguraPct = ctx.measureText(r.pct).width;
      ctx.fillText(r.pct, PAD + largUtil - 40, meio);

      // Nome: encolhe a fonte até caber ao lado da porcentagem
      ctx.textAlign = 'left';
      let tam = 40;
      const disponivel = largUtil - 40 - 40 - larguraPct - 24;
      while (tam > 22) {
        ctx.font = fonte(700, tam);
        if (ctx.measureText(r.nome).width <= disponivel) break;
        tam -= 2;
      }
      ctx.fillText(r.nome, PAD + 40, meio);
      y += LINHA_ALTURA + LINHA_GAP;
    }
    y += 60 - LINHA_GAP;

    ctx.textAlign = 'center';
    ctx.fillStyle = corRodape;
    ctx.font = fonte(400, 34);
    ctx.fillText(rodapeLinha1, L / 2, y + 25);
    y += 50;
    ctx.font = fonte(700, 38);
    ctx.fillText(rodapeLinha2, L / 2, y + 25);

    return await new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'));
  } catch (err) {
    console.error('Falha ao gerar a imagem do resultado', err);
    return null;
  }
}
