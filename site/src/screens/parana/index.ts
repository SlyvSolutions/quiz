import { el, type Filho } from '../../ui/dom';
import { criarIcone } from '../../ui/icone';
import { criarOnca } from '../../ui/logo';
import { carregarCandidatosPR } from '../../data/carregar';
import type { BaseCandidatosPR, CandidatoPR } from '../../data/tipos';

export const TITULO_PARANA = 'Candidatos da Missão no PR';
export const APOIO_PARANA =
  'Alguns dos principais candidatos da Missão no Paraná. Dados públicos do TSE e da imprensa, com fonte em cada item.';
export const TEXTO_SEM_MATERIAL = 'Dados cadastrais do TSE — ainda sem propostas publicadas';
export const TEXTO_VAZIO = 'Nenhum candidato cadastrado no momento.';
export const TEXTO_CARREGANDO = 'Carregando os candidatos...';
export const TEXTO_ERRO = 'Não foi possível carregar os candidatos agora.';
export const TEXTO_TENTAR = 'Tentar de novo';
export const URL_DIVULGACAND = 'https://divulgacandcontas.tse.jus.br/';
export const URL_MISSAO_CANDIDATOS = 'https://candidatos.missao.org.br/';
export const URL_MISSAO_CANDIDATOS_PR = 'https://candidatos.missao.org.br/?uf=PR';
/** Rota da colinha do Paraná no site do Missão (a mesma que o botão "Monte sua colinha" da lista abre). */
export const URL_COLINHA_PR = 'https://candidatos.missao.org.br/colinha/pr';
export const TEXTO_OUTROS_ESTADOS = 'Candidatos da Missão de outros estados';
export const TEXTO_COLINHA = 'Monte sua colinha';
export const TEXTO_FILTRO_VAZIO = 'Nenhum candidato com esses filtros.';
export const TEXTO_LIMPAR = 'Limpar filtros';
export const TEXTO_SO_COMPLETOS = 'Só com material completo';

/** Idade em anos completos a partir de nascimento no formato ano-mes-dia. */
export function calcularIdade(nascimento: string | undefined, hoje: Date = new Date()): number | null {
  if (!nascimento) return null;
  const partes = /^(\d{4})-(\d{2})-(\d{2})/.exec(nascimento.trim());
  if (!partes) return null;
  const ano = Number(partes[1]);
  const mes = Number(partes[2]);
  const dia = Number(partes[3]);
  if (!ano || mes < 1 || mes > 12 || dia < 1 || dia > 31) return null;
  let idade = hoje.getFullYear() - ano;
  const mesAtual = hoje.getMonth() + 1;
  const diaAtual = hoje.getDate();
  if (mesAtual < mes || (mesAtual === mes && diaAtual < dia)) idade -= 1;
  return idade < 0 ? null : idade;
}

export type GrupoCargo = 'presidente' | 'gov' | 'senado' | 'federal' | 'estadual' | 'outro';

/** Classifica o cargo pelo texto, sem diferenciar maiúsculas. */
export function classificarCargo(cargo: string): GrupoCargo {
  const texto = cargo.toLowerCase();
  if (texto.includes('presidente') && !texto.includes('vice')) return 'presidente';
  if (texto.includes('governador')) return 'gov';
  if (texto.includes('senador') || texto.includes('suplente')) return 'senado';
  if (texto.includes('deputado federal')) return 'federal';
  if (texto.includes('deputado estadual')) return 'estadual';
  return 'outro';
}

function ehVice(c: CandidatoPR): boolean {
  return c.cargo.toLowerCase().includes('vice');
}

function ehSuplente(c: CandidatoPR): boolean {
  return c.cargo.toLowerCase().includes('suplente');
}

function nomeVice(titular: CandidatoPR, vice: CandidatoPR | undefined): string | null {
  if (vice) return vice.nomeUrna;
  const daChapa = titular.chapa?.vice?.trim();
  return daChapa ? daChapa : null;
}

function dominioDe(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return 'fonte';
  }
}

function linkExterno(rotulo: string, href: string): HTMLElement {
  return el('a', { class: 'parana-link', attrs: { href, target: '_blank', rel: 'noopener noreferrer' } }, rotulo);
}

function botaoExterno(rotulo: string, href: string, classe: string): HTMLElement {
  return el(
    'a',
    { class: `btn-pill ${classe}`, attrs: { href, target: '_blank', rel: 'noopener noreferrer' } },
    rotulo,
    criarIcone('seta')
  );
}

/** Tem material próprio: ao menos uma proposta ou um item de histórico com fonte. */
export function temMaterial(c: CandidatoPR): boolean {
  return c.propostas.length > 0 || c.historico.length > 0;
}

/** Usuário do Instagram sem arroba, ou null se o texto não for um usuário válido. */
export function usuarioInstagram(valor: string | undefined): string | null {
  const limpo = (valor ?? '').trim().replace(/^@/, '');
  return /^[A-Za-z0-9._]{1,30}$/.test(limpo) ? limpo : null;
}

/** Iniciais para o avatar sem foto: primeira letra do primeiro e do último nome. */
export function iniciaisDe(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '?';
  const primeira = partes[0]!.charAt(0);
  const ultima = partes.length > 1 ? partes[partes.length - 1]!.charAt(0) : '';
  return (primeira + ultima).toUpperCase();
}

/** Avatar circular: foto local quando existir, senão as iniciais. Mesmo círculo nos dois casos. */
function criarAvatarCandidato(c: CandidatoPR): HTMLElement {
  const foto = c.foto?.trim();
  if (foto) {
    const img = el('img', {
      class: 'parana-foto',
      attrs: { src: foto, alt: c.nomeUrna, loading: 'lazy', decoding: 'async' },
    });
    return el('span', { class: 'parana-avatar parana-avatar-foto' }, img);
  }
  return el('span', { class: 'parana-avatar', attrs: { 'aria-hidden': 'true' } }, iniciaisDe(c.nomeUrna));
}

/** Número em "teclas de urna": cada dígito numa casinha, os dois primeiros (o 14) em destaque. */
function criarSeloNumero(numero: string): HTMLElement {
  const digitos = [...numero].map((d, i) =>
    el('span', { class: i < 2 ? 'parana-digito parana-digito-14' : 'parana-digito', texto: d })
  );
  return el('span', { class: 'parana-selo', attrs: { role: 'img', 'aria-label': `Número ${numero}` } }, ...digitos);
}

/** Cabeçalho do cartão. Completo: avatar, nome, cargo e número. Básico (compacto): avatar, nome e número na mesma linha. */
function criarCabecalhoCartao(c: CandidatoPR, compacto = false): HTMLElement {
  if (compacto) {
    return el(
      'div',
      { class: 'parana-cab' },
      criarAvatarCandidato(c),
      el('div', { class: 'parana-id' }, el('h4', { class: 'parana-nome', texto: c.nomeUrna })),
      criarSeloNumero(c.numero)
    );
  }
  return el(
    'div',
    { class: 'parana-cab' },
    criarAvatarCandidato(c),
    el(
      'div',
      { class: 'parana-id' },
      el('p', { class: 'parana-cargo', texto: `${c.cargo} · ${c.partido}` }),
      el('h4', { class: 'parana-nome', texto: c.nomeUrna }),
      criarSeloNumero(c.numero)
    )
  );
}

/** Um cartão de candidato: cabeçalho comum, chips, dados, bio curta, propostas e feitos em details, notas e fontes. */
export function criarCartaoCandidato(c: CandidatoPR, variante: 'cheio' | 'menor' = 'cheio'): HTMLElement {
  const cartao = el('article', { class: `card parana-card parana-card-${variante}` });
  cartao.appendChild(criarCabecalhoCartao(c));
  if (c.primeiraCandidatura) {
    cartao.appendChild(el('p', { class: 'parana-chips' }, el('span', { class: 'chip', texto: 'Primeira candidatura' })));
  }

  const idade = calcularIdade(c.nascimento);
  const dados: string[] = [];
  if (idade !== null) dados.push(`${idade} anos`);
  if (c.naturalidade) dados.push(c.naturalidade);
  if (dados.length > 0) cartao.appendChild(el('p', { class: 'parana-dados', texto: dados.join(' · ') }));
  const perfil = [c.ocupacaoDeclarada, c.escolaridade].filter((t): t is string => Boolean(t && t.trim()));
  if (perfil.length > 0) cartao.appendChild(el('p', { class: 'parana-ocupacao', texto: perfil.join(' · ') }));
  if (c.bio) cartao.appendChild(el('p', { class: 'parana-bio', texto: c.bio }));
  const insta = usuarioInstagram(c.instagram);
  if (insta) {
    cartao.appendChild(
      el(
        'p',
        { class: 'parana-instagram' },
        el(
          'a',
          {
            class: 'parana-link',
            attrs: { href: `https://www.instagram.com/${insta}/`, target: '_blank', rel: 'noopener noreferrer' },
          },
          `Instagram @${insta}`
        )
      )
    );
  }

  if (c.propostas.length > 0) {
    cartao.appendChild(
      el(
        'details',
        { class: 'contexto' },
        el('summary', {}, `Propostas (${c.propostas.length})`),
        el(
          'div',
          { class: 'contexto-corpo' },
          ...c.propostas.map((p) =>
            el(
              'div',
              { class: 'parana-proposta' },
              el('p', {}, el('strong', { texto: p.titulo })),
              el('p', { texto: p.resumo }),
              linkExterno(dominioDe(p.fonte), p.fonte)
            )
          )
        )
      )
    );
  }

  if (c.historico.length > 0) {
    cartao.appendChild(
      el(
        'details',
        { class: 'contexto' },
        el('summary', {}, 'O que já fez'),
        el(
          'div',
          { class: 'contexto-corpo' },
          ...c.historico.map((h) =>
            el('div', { class: 'parana-proposta' }, el('p', { texto: h.descricao }), linkExterno(dominioDe(h.fonte), h.fonte))
          )
        )
      )
    );
  }

  const temNotas = c.observacoes.length > 0;
  const temFontes = c.fontes.length > 0;
  if (temNotas || temFontes) {
    const total = c.observacoes.length + c.fontes.length;
    const rotulo = temNotas && temFontes ? 'Fontes e notas' : temFontes ? 'Fontes' : 'Notas';
    const corpo: Filho[] = [];
    for (const obs of c.observacoes) {
      corpo.push(el('p', { class: 'parana-nota' }, el('strong', { texto: 'Nota: ' }), obs));
    }
    if (temFontes) {
      corpo.push(el('ul', { class: 'parana-fontes-lista' }, ...c.fontes.map((f) => el('li', {}, linkExterno(f.titulo, f.url)))));
    }
    cartao.appendChild(
      el('details', { class: 'contexto parana-fontes' }, el('summary', {}, `${rotulo} (${total})`), el('div', { class: 'contexto-corpo' }, ...corpo))
    );
  }

  return cartao;
}

/* ---------- Filtro ---------- */

export type FiltroCargo = 'todos' | 'presidente' | 'gov' | 'senado' | 'federal' | 'estadual';

export interface FiltroParana {
  cargo: FiltroCargo;
  busca: string;
  soCompletos: boolean;
}

export const FILTRO_INICIAL: FiltroParana = { cargo: 'todos', busca: '', soCompletos: false };

const ROTULOS_CARGO: ReadonlyArray<readonly [FiltroCargo, string]> = [
  ['todos', 'Todos'],
  ['presidente', 'Presidente'],
  ['gov', 'Governador'],
  ['senado', 'Senado'],
  ['federal', 'Federal'],
  ['estadual', 'Estadual'],
];

/** Minúsculas, sem acento e sem espaço nas pontas, para comparar nome sem se preocupar com grafia. */
export function normalizarBusca(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

export function filtroAtivo(f: FiltroParana): boolean {
  return f.cargo !== 'todos' || normalizarBusca(f.busca) !== '' || f.soCompletos;
}

/** Aplica cargo, busca (nome de urna, nome completo ou número) e "só completos". Mantém a ordem recebida. */
export function filtrarCandidatos(candidatos: CandidatoPR[], f: FiltroParana): CandidatoPR[] {
  const termo = normalizarBusca(f.busca);
  return candidatos.filter((c) => {
    if (f.cargo !== 'todos' && classificarCargo(c.cargo) !== f.cargo) return false;
    if (f.soCompletos && !temMaterial(c)) return false;
    if (termo) {
      const alvo = normalizarBusca(`${c.nomeUrna} ${c.nomeCompleto} ${c.numero}`);
      if (!alvo.includes(termo)) return false;
    }
    return true;
  });
}

/* ---------- Grupos ---------- */

/** Grupo: primeiro quem tem propostas ou histórico; depois, se houver, o bloco "Mais candidatos a ..." com os demais. */
function secaoGrupoMista(titulo: string, principais: HTMLElement[], demais: HTMLElement[], tituloMais: string): HTMLElement {
  const total = principais.length + demais.length;
  const corpo: Filho[] = [];
  if (principais.length > 0) corpo.push(el('div', { class: 'parana-grade' }, ...principais));
  if (demais.length > 0) {
    corpo.push(
      el(
        'div',
        { class: 'parana-mais' },
        el('h4', { class: 'parana-mais-titulo', texto: tituloMais }),
        el('p', { class: 'parana-mais-apoio', texto: TEXTO_SEM_MATERIAL }),
        el('div', { class: 'parana-grade' }, ...demais)
      )
    );
  }
  return el(
    'section',
    { class: 'parana-grupo' },
    el(
      'div',
      { class: 'parana-grupo-cab' },
      el('h3', { class: 'parana-grupo-titulo', texto: titulo }),
      el('span', { class: 'parana-grupo-n', texto: total === 1 ? '1 candidato' : `${total} candidatos` })
    ),
    ...corpo
  );
}

/** Grupos na ordem Presidente, Governador, Senado, Federal, Estadual; completos antes dos básicos em cada um. */
export function montarConteudo(dados: BaseCandidatosPR, filtro: FiltroParana = FILTRO_INICIAL): HTMLElement[] {
  const candidatos = filtrarCandidatos(dados.candidatos, filtro);
  const presidentes = candidatos.filter((c) => classificarCargo(c.cargo) === 'presidente');
  const gov = candidatos.filter((c) => classificarCargo(c.cargo) === 'gov');
  const senado = candidatos.filter((c) => classificarCargo(c.cargo) === 'senado');
  const federais = candidatos.filter((c) => classificarCargo(c.cargo) === 'federal');
  const estaduais = candidatos.filter((c) => classificarCargo(c.cargo) === 'estadual');
  const outros = candidatos.filter((c) => classificarCargo(c.cargo) === 'outro');

  const cartoes = (lista: CandidatoPR[], variante: 'cheio' | 'menor' = 'cheio'): HTMLElement[] =>
    lista.map((c) => criarCartaoCandidato(c, variante));

  const simples = (titulo: string, lista: CandidatoPR[], tituloMais: string): HTMLElement =>
    secaoGrupoMista(titulo, cartoes(lista.filter(temMaterial)), cartoes(lista.filter((c) => !temMaterial(c))), tituloMais);

  const blocos: HTMLElement[] = [];

  if (presidentes.length > 0) blocos.push(simples('Presidente', presidentes, 'Mais candidatos a Presidente'));

  if (gov.length > 0) {
    const titular = gov.find((c) => !ehVice(c) && temMaterial(c)) ?? gov.find((c) => !ehVice(c));
    const vice = gov.find((c) => ehVice(c));
    const principais: HTMLElement[] = [];
    if (titular) {
      const cartaoTitular = criarCartaoCandidato(titular);
      const viceNome = nomeVice(titular, vice);
      if (viceNome) {
        const linhaVice = el('p', { class: 'parana-vice-linha', texto: `Vice: ${viceNome}` });
        cartaoTitular.insertBefore(linhaVice, cartaoTitular.querySelector('.parana-bio, details'));
      }
      principais.push(cartaoTitular);
    }
    if (vice) principais.push(criarCartaoCandidato(vice, 'menor'));
    const resto = gov.filter((c) => c !== titular && c !== vice);
    const comMaterial = resto.filter(temMaterial);
    blocos.push(
      secaoGrupoMista(
        'Governador e vice',
        [...principais, ...cartoes(comMaterial, 'menor')],
        cartoes(resto.filter((c) => !temMaterial(c)), 'menor'),
        'Mais candidatos a Governador'
      )
    );
  }

  if (senado.length > 0) {
    const titular = senado.find((c) => !ehSuplente(c));
    const suplentes = senado.filter((c) => c !== titular && ehSuplente(c));
    const principais: HTMLElement[] = [];
    if (titular) principais.push(criarCartaoCandidato(titular));
    principais.push(...cartoes(suplentes, 'menor'));
    const resto = senado.filter((c) => c !== titular && !ehSuplente(c));
    blocos.push(
      secaoGrupoMista(
        'Senado',
        [...principais, ...cartoes(resto.filter(temMaterial))],
        cartoes(resto.filter((c) => !temMaterial(c))),
        'Mais candidatos ao Senado'
      )
    );
  }

  if (federais.length > 0) blocos.push(simples('Deputados federais', federais, 'Mais candidatos a Deputado Federal'));
  if (estaduais.length > 0) blocos.push(simples('Deputados estaduais', estaduais, 'Mais candidatos a Deputado Estadual'));
  if (outros.length > 0) blocos.push(simples('Outras candidaturas', outros, 'Mais candidatos'));

  return blocos;
}

/* ---------- Blocos de convite e rodapé ---------- */

/** Bloco escuro com a onça: convida o apoiador de outro estado a ver os candidatos de lá. */
export function montarBlocoOutrosEstados(): HTMLElement {
  return el(
    'aside',
    { class: 'parana-outros', attrs: { 'aria-labelledby': 'parana-outros-titulo' } },
    el('div', { class: 'parana-outros-onca' }, criarOnca('')),
    el(
      'div',
      { class: 'parana-outros-texto' },
      el('p', { class: 'eyebrow', texto: 'Não é do Paraná?' }),
      el('h3', { class: 'parana-outros-titulo', attrs: { id: 'parana-outros-titulo' }, texto: 'O futuro é glorioso em todo o Brasil' }),
      el('p', { class: 'parana-outros-apoio', texto: 'Veja quem é da Missão no seu estado e escolha com calma.' })
    ),
    botaoExterno(TEXTO_OUTROS_ESTADOS, URL_MISSAO_CANDIDATOS, 'btn-primaria parana-outros-cta')
  );
}

export function montarRodape(dados: BaseCandidatosPR): HTMLElement {
  return el(
    'div',
    { class: 'parana-rodape' },
    el('p', { class: 'parana-aviso', texto: dados.aviso }),
    el(
      'div',
      { class: 'parana-rodape-links' },
      linkExterno('Conferir no DivulgaCandContas', URL_DIVULGACAND),
      linkExterno('Lista completa do Paraná no site do Missão', URL_MISSAO_CANDIDATOS_PR)
    )
  );
}

export function montarCarregando(): HTMLElement {
  return el('p', { class: 'parana-vazio', texto: TEXTO_CARREGANDO });
}

export function montarVazio(): HTMLElement {
  return el('p', { class: 'parana-vazio', texto: TEXTO_VAZIO });
}

export function montarErro(tentarDeNovo: () => void): HTMLElement {
  const botao = el('button', { class: 'btn-pill btn-secundaria', attrs: { type: 'button' } }, TEXTO_TENTAR);
  botao.addEventListener('click', tentarDeNovo);
  return el('div', { class: 'parana-erro' }, el('p', { texto: TEXTO_ERRO }), botao);
}

/* ---------- Barra de filtro ---------- */

interface BarraFiltro {
  no: HTMLElement;
}

function criarBarraFiltro(
  dados: BaseCandidatosPR,
  estado: FiltroParana,
  aoMudar: () => void,
  contagem: HTMLElement
): BarraFiltro {
  const contar = (g: FiltroCargo): number =>
    g === 'todos' ? dados.candidatos.length : dados.candidatos.filter((c) => classificarCargo(c.cargo) === g).length;

  const botoesCargo = new Map<FiltroCargo, HTMLButtonElement>();
  const grupo = el('div', { class: 'parana-filtro-cargos', attrs: { role: 'group', 'aria-label': 'Filtrar por cargo' } });
  for (const [valor, rotulo] of ROTULOS_CARGO) {
    const n = contar(valor);
    if (valor !== 'todos' && n === 0) continue;
    const b = el(
      'button',
      { class: 'parana-filtro-botao', attrs: { type: 'button', 'aria-pressed': String(estado.cargo === valor) } },
      rotulo,
      el('span', { class: 'parana-filtro-n', texto: String(n) })
    ) as HTMLButtonElement;
    b.addEventListener('click', () => {
      estado.cargo = valor;
      sincronizar();
      aoMudar();
    });
    botoesCargo.set(valor, b);
    grupo.appendChild(b);
  }

  const campo = el('input', {
    class: 'parana-busca-campo',
    attrs: {
      id: 'parana-busca',
      type: 'search',
      inputmode: 'search',
      autocomplete: 'off',
      placeholder: 'Nome ou número',
      enterkeyhint: 'search',
    },
  }) as HTMLInputElement;
  campo.addEventListener('input', () => {
    estado.busca = campo.value;
    aoMudar();
  });
  const busca = el(
    'div',
    { class: 'parana-busca' },
    el('label', { class: 'parana-busca-rotulo', attrs: { for: 'parana-busca' } }, 'Buscar por nome ou número'),
    el('div', { class: 'parana-busca-caixa' }, criarIcone('busca'), campo)
  );

  const completos = el(
    'button',
    { class: 'parana-filtro-botao parana-filtro-completos', attrs: { type: 'button', 'aria-pressed': 'false' } },
    criarIcone('check'),
    TEXTO_SO_COMPLETOS
  ) as HTMLButtonElement;
  completos.addEventListener('click', () => {
    estado.soCompletos = !estado.soCompletos;
    sincronizar();
    aoMudar();
  });

  function sincronizar(): void {
    for (const [valor, b] of botoesCargo) b.setAttribute('aria-pressed', String(estado.cargo === valor));
    completos.setAttribute('aria-pressed', String(estado.soCompletos));
  }

  const no = el(
    'div',
    { class: 'parana-filtro', attrs: { role: 'search', 'aria-label': 'Filtrar candidatos' } },
    grupo,
    el('div', { class: 'parana-filtro-linha' }, busca, completos),
    contagem
  );

  /** Limpar de fora (estado vazio): volta tudo ao início, inclusive o texto do campo. */
  no.addEventListener('parana:limpar', () => {
    estado.cargo = 'todos';
    estado.busca = '';
    estado.soCompletos = false;
    campo.value = '';
    sincronizar();
    aoMudar();
  });

  return { no };
}

function textoContagem(total: number, exibidos: number, filtrado: boolean): string {
  const plural = (n: number): string => (n === 1 ? '1 candidato' : `${n} candidatos`);
  return filtrado ? `Mostrando ${exibidos} de ${plural(total)}` : plural(total);
}

export async function renderParana(): Promise<HTMLElement> {
  const container = el('div', { class: 'screen-parana tela' });

  container.appendChild(
    el(
      'header',
      { class: 'tela-topo parana-header com-brilho' },
      el(
        'div',
        { class: 'conteudo' },
        el('p', { class: 'eyebrow', texto: 'Paraná · Missão 14' }),
        el('h2', { texto: TITULO_PARANA }),
        el('p', { class: 'lead', texto: APOIO_PARANA }),
        el(
          'div',
          { class: 'parana-acoes' },
          botaoExterno(TEXTO_COLINHA, URL_COLINHA_PR, 'btn-primaria'),
          botaoExterno(TEXTO_OUTROS_ESTADOS, URL_MISSAO_CANDIDATOS, 'btn-secundaria')
        )
      )
    )
  );

  const area = el('div', { class: 'conteudo parana-lista' }, montarCarregando());
  container.appendChild(area);

  const carregar = async (): Promise<void> => {
    area.replaceChildren(montarCarregando());
    try {
      const dados = await carregarCandidatosPR();
      if (dados.candidatos.length === 0) {
        area.replaceChildren(montarVazio(), montarBlocoOutrosEstados());
        return;
      }

      const estado: FiltroParana = { ...FILTRO_INICIAL };
      const contagem = el('p', { class: 'parana-contagem', attrs: { role: 'status', 'aria-live': 'polite' } });
      const resultado = el('div', { class: 'parana-resultado' });

      const desenhar = (): void => {
        const visiveis = filtrarCandidatos(dados.candidatos, estado);
        contagem.textContent = textoContagem(dados.candidatos.length, visiveis.length, filtroAtivo(estado));
        if (visiveis.length === 0) {
          const limpar = el('button', { class: 'btn-pill btn-secundaria', attrs: { type: 'button' } }, TEXTO_LIMPAR);
          limpar.addEventListener('click', () => barra.no.dispatchEvent(new CustomEvent('parana:limpar')));
          resultado.replaceChildren(
            el(
              'div',
              { class: 'parana-filtro-vazio' },
              el('p', { class: 'parana-filtro-vazio-titulo', texto: TEXTO_FILTRO_VAZIO }),
              el('p', { class: 'parana-vazio', texto: 'Tente outro nome, outro número ou outro cargo.' }),
              limpar
            )
          );
          return;
        }
        resultado.replaceChildren(...montarConteudo(dados, estado));
      };

      const barra = criarBarraFiltro(dados, estado, desenhar, contagem);
      desenhar();
      area.replaceChildren(barra.no, resultado, montarBlocoOutrosEstados(), montarRodape(dados));
    } catch (e) {
      console.error('Erro ao carregar candidatos do PR', e);
      area.replaceChildren(montarErro(() => void carregar()));
    }
  };
  await carregar();

  return container;
}
