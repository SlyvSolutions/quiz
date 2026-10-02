// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  renderParana,
  calcularIdade,
  classificarCargo,
  TITULO_PARANA,
  APOIO_PARANA,
  TEXTO_SEM_MATERIAL,
  iniciaisDe,
  filtrarCandidatos,
  normalizarBusca,
  URL_COLINHA_PR,
  URL_MISSAO_CANDIDATOS,
  TEXTO_OUTROS_ESTADOS,
  FILTRO_INICIAL,
} from '../../src/screens/parana/index';
import type { BaseCandidatosPR } from '../../src/data/tipos';

function baseFixture(): BaseCandidatosPR {
  return {
    versao: 'teste',
    geradoEm: '2026-09-30',
    aviso: 'Aviso de teste: confira sempre no DivulgaCandContas.',
    fontesGerais: [],
    candidatos: [
      {
        id: 'gov-1',
        cargo: 'Governador',
        nomeUrna: 'Luiz França',
        nomeCompleto: 'Luiz Felipe Martins França',
        numero: '14',
        partido: 'MISSÃO',
        situacaoTSE: 'Concorrendo (dado de teste)',
        nascimento: '1993-11-18',
        naturalidade: 'Cianorte (PR)',
        primeiraCandidatura: true,
        bio: 'Bio do governador.',
        chapa: { vice: 'João Adolfo Wendpap' },
        propostas: [
          { titulo: 'Proposta um', resumo: 'Resumo um.', fonte: 'https://exemplo.com/um' },
          { titulo: 'Proposta dois', resumo: 'Resumo dois.', fonte: 'https://imprensa.exemplo.org/dois' },
        ],
        historico: [{ descricao: 'Feito um.', fonte: 'https://exemplo.com/feito' }],
        observacoes: ['Obs do gov.'],
        fontes: [{ titulo: 'Perfil na imprensa', url: 'https://exemplo.com/perfil' }],
        lacunas: ['lacuna secreta do gov'],
        revisar: false,
        basico: false,
      },
      {
        id: 'vice-1',
        cargo: 'Vice-governador',
        nomeUrna: 'João Adolfo',
        nomeCompleto: 'João Adolfo Padilha',
        numero: '14',
        partido: 'MISSÃO',
        situacaoTSE: 'Na chapa (dado de teste)',
        bio: 'Bio do vice.',
        chapa: { titular: 'Luiz França' },
        propostas: [],
        historico: [],
        observacoes: [],
        fontes: [{ titulo: 'Perfil do vice', url: 'https://exemplo.com/vice' }],
        lacunas: [],
        revisar: false,
        basico: false,
      },
      {
        id: 'sen-1',
        cargo: 'Senadora',
        nomeUrna: 'Karen Guerreiro',
        nomeCompleto: 'Karen Correia Guerreiro',
        numero: '144',
        partido: 'MISSÃO',
        situacaoTSE: 'Deferido (dado de teste)',
        nascimento: '1980-10-31',
        naturalidade: 'Pelotas (RS)',
        ocupacaoDeclarada: 'Gerente',
        bio: 'Bio da senadora.',
        propostas: [{ titulo: 'Proposta senado', resumo: 'Resumo senado.', fonte: 'https://exemplo.com/senado' }],
        historico: [],
        observacoes: [],
        fontes: [{ titulo: 'Entrevista', url: 'https://exemplo.com/entrevista' }],
        lacunas: ['lacuna secreta do senado'],
        revisar: true,
        basico: false,
      },
      {
        id: 'fed-completo-1',
        cargo: 'Deputado Federal',
        nomeUrna: 'Federal Completo',
        nomeCompleto: 'Federal Completo da Silva',
        numero: '1400',
        partido: 'MISSÃO',
        situacaoTSE: 'Deferido (dado de teste)',
        bio: 'Bio do federal completo.',
        propostas: [{ titulo: 'Prop fed', resumo: 'Resumo fed.', fonte: 'https://exemplo.com/fed' }],
        historico: [],
        observacoes: [],
        fontes: [{ titulo: 'Fonte fed', url: 'https://exemplo.com/fed-fonte' }],
        lacunas: [],
        revisar: false,
        basico: false,
      },
      {
        id: 'fed-basico-1',
        cargo: 'Deputado Federal',
        nomeUrna: 'Federal Basico Um',
        nomeCompleto: 'Federal Basico Um',
        numero: '1411',
        partido: 'MISSÃO',
        situacaoTSE: 'Deferido (dado de teste)',
        bio: '',
        propostas: [],
        historico: [],
        observacoes: [],
        fontes: [],
        lacunas: [],
        revisar: false,
        basico: true,
      },
      {
        id: 'fed-basico-2',
        cargo: 'Deputado Federal',
        nomeUrna: 'Federal Basico Dois',
        nomeCompleto: 'Federal Basico Dois',
        numero: '1422',
        partido: 'MISSÃO',
        situacaoTSE: 'Deferido (dado de teste)',
        bio: '',
        propostas: [],
        historico: [],
        observacoes: [],
        fontes: [],
        lacunas: [],
        revisar: false,
        basico: true,
      },
    ],
  };
}

function mockarOk(base: BaseCandidatosPR) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok: true, json: async () => base }))
  );
}

beforeEach(() => {
  document.body.innerHTML = '';
  vi.useRealTimers();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('tela parana: titulo e grupos', () => {
  it('mostra o titulo e o apoio com fonte em cada item', async () => {
    mockarOk(baseFixture());
    const tela = await renderParana();
    document.body.appendChild(tela);
    expect(tela.querySelector('h2')?.textContent).toBe(TITULO_PARANA);
    expect(APOIO_PARANA).toMatch(/Alguns dos principais candidatos/);
    expect(tela.textContent).toMatch(/Dados públicos do TSE/);
    expect(tela.textContent).toMatch(/com fonte em cada item/);
  });

  it('ordena Governador e vice antes do Senado e sem linha de futuro', async () => {
    mockarOk(baseFixture());
    const tela = await renderParana();
    const titulos = [...tela.querySelectorAll('.parana-grupo-titulo')].map((e) => e.textContent);
    expect(titulos[0]).toBe('Governador e vice');
    expect(titulos[1]).toBe('Senado');
    expect(tela.textContent).not.toMatch(/entram nas próximas atualizações/);
  });

  it('chapa em um cartao: titular com numero e linha Vice, vice menor abaixo', async () => {
    mockarOk(baseFixture());
    const tela = await renderParana();
    const grupo = [...tela.querySelectorAll('.parana-grupo')].find((s) =>
      s.querySelector('.parana-grupo-titulo')?.textContent?.includes('Governador')
    )!;
    expect(grupo.querySelector('.parana-selo')?.textContent).toBe('14');
    expect(grupo.textContent).toMatch(/Vice: João Adolfo/);
    const cartoes = grupo.querySelectorAll('.parana-card');
    expect(cartoes.length).toBe(2);
    expect(cartoes[1]?.classList.contains('parana-card-menor')).toBe(true);
  });

  it('numero do senado visivel', async () => {
    mockarOk(baseFixture());
    const tela = await renderParana();
    const numeros = [...tela.querySelectorAll('.parana-selo')].map((e) => e.textContent);
    expect(numeros).toContain('144');
  });
});

describe('tela parana: cartoes', () => {
  it('sem details de propostas quando vazias; com details quando ha', async () => {
    mockarOk(baseFixture());
    const tela = await renderParana();
    const cartaoVice = [...tela.querySelectorAll('.parana-card')].find((c) =>
      c.querySelector('.parana-nome')?.textContent?.includes('João Adolfo')
    )!;
    expect(cartaoVice.textContent).not.toMatch(/Propostas/);
    expect(cartaoVice.querySelectorAll('details').length).toBe(1);
    const cartaoGov = [...tela.querySelectorAll('.parana-card')].find((c) =>
      c.querySelector('.parana-nome')?.textContent?.includes('Luiz França')
    )!;
    expect(cartaoGov.querySelector('summary')?.textContent).toBe('Propostas (2)');
  });

  it('sem details de feitos quando historico vazio', async () => {
    mockarOk(baseFixture());
    const tela = await renderParana();
    const cartaoSen = [...tela.querySelectorAll('.parana-card')].find((c) =>
      c.querySelector('.parana-nome')?.textContent?.includes('Karen')
    )!;
    expect(cartaoSen.textContent).not.toMatch(/O que já fez/);
  });

  it('links externos abrem em nova aba com rel noopener', async () => {
    mockarOk(baseFixture());
    const tela = await renderParana();
    const externos = [...tela.querySelectorAll<HTMLAnchorElement>('a[target="_blank"]')];
    expect(externos.length).toBeGreaterThan(0);
    for (const a of externos) {
      expect(a.getAttribute('rel')).toContain('noopener');
      expect(a.getAttribute('rel')).toContain('noreferrer');
      expect(a.getAttribute('href')).toMatch(/^https:\/\//);
    }
    const rodape = tela.querySelector('.parana-rodape')!;
    expect(rodape.textContent).toMatch(/Conferir no DivulgaCandContas/);
  });

  it('rodape tem link da lista completa do PR com noopener', async () => {
    mockarOk(baseFixture());
    const tela = await renderParana();
    const link = [...tela.querySelectorAll<HTMLAnchorElement>('.parana-rodape a')].find(
      (a) => a.getAttribute('href') === 'https://candidatos.missao.org.br/?uf=PR'
    )!;
    expect(link).toBeTruthy();
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toContain('noopener');
  });

  it('nao exibe lacunas, situacaoTSE nem revisar', async () => {
    mockarOk(baseFixture());
    const tela = await renderParana();
    expect(tela.textContent).not.toMatch(/lacuna secreta/);
    expect(tela.textContent).not.toMatch(/dado de teste/);
    expect(tela.textContent).not.toMatch(/Concorrendo/);
  });

  it('proposta mostra dominio como texto do link fonte', async () => {
    mockarOk(baseFixture());
    const tela = await renderParana();
    const links = [...tela.querySelectorAll<HTMLAnchorElement>('.parana-proposta a')];
    expect(links.map((a) => a.textContent)).toContain('exemplo.com');
    expect(links.map((a) => a.textContent)).toContain('imprensa.exemplo.org');
  });
});

describe('tela parana: sem material proprio', () => {
  it('cartao sem propostas e sem historico continua completo e sem secoes vazias', async () => {
    const base = baseFixture();
    const c = base.candidatos.find((x) => x.id === 'fed-basico-1')!;
    c.bio = 'Bio curta do federal.';
    c.ocupacaoDeclarada = 'Advogado';
    c.escolaridade = 'Superior completo';
    c.nascimento = '1990-01-01';
    c.naturalidade = 'Londrina (PR)';
    c.instagram = '@federal.um';
    mockarOk(base);
    const tela = await renderParana();
    const cartao = [...tela.querySelectorAll('.parana-card')].find(
      (x) => x.querySelector('.parana-nome')?.textContent === 'Federal Basico Um'
    )!;
    expect(cartao.querySelector('.parana-avatar')).not.toBeNull();
    expect(cartao.querySelector('.parana-selo')?.textContent).toBe('1411');
    expect(cartao.querySelector('.parana-dados')?.textContent).toMatch(/anos · Londrina \(PR\)/);
    expect(cartao.querySelector('.parana-ocupacao')?.textContent).toBe('Advogado · Superior completo');
    expect(cartao.querySelector('.parana-bio')?.textContent).toBe('Bio curta do federal.');
    const insta = cartao.querySelector<HTMLAnchorElement>('.parana-instagram a')!;
    expect(insta.getAttribute('href')).toBe('https://www.instagram.com/federal.um/');
    expect(insta.getAttribute('target')).toBe('_blank');
    expect(insta.getAttribute('rel')).toContain('noopener');
    expect(cartao.querySelector('details')).toBeNull();
    expect(cartao.querySelector('.parana-chips')).toBeNull();
  });

  it('bloco Mais candidatos a Deputado Federal agrupa quem nao tem propostas nem historico, depois dos com material', async () => {
    mockarOk(baseFixture());
    const tela = await renderParana();
    const grupoFed = [...tela.querySelectorAll('.parana-grupo')].find((s) =>
      s.querySelector('.parana-grupo-titulo')?.textContent?.includes('Deputados federais')
    )!;
    expect(grupoFed.querySelector('.parana-mais-titulo')?.textContent).toBe('Mais candidatos a Deputado Federal');
    expect(grupoFed.querySelector('.parana-mais-apoio')?.textContent).toBe(TEXTO_SEM_MATERIAL);
    expect(TEXTO_SEM_MATERIAL).toMatch(/ainda sem propostas publicadas/);
    const nomesMais = [...grupoFed.querySelectorAll('.parana-mais .parana-nome')].map((e) => e.textContent);
    expect(nomesMais).toEqual(['Federal Basico Um', 'Federal Basico Dois']);
    const principal = grupoFed.querySelector('.parana-grade:not(.parana-mais .parana-grade)')!;
    expect([...principal.querySelectorAll('.parana-nome')].map((e) => e.textContent)).toEqual(['Federal Completo']);
    expect(tela.textContent).not.toMatch(/Outros candidatos/);
  });

  it('tem material por historico mesmo sem propostas; ordem do material antes dos demais', async () => {
    const base = baseFixture();
    const fed = base.candidatos.filter((c) => c.cargo === 'Deputado Federal');
    // o ultimo passa a ter so historico: deve subir para o bloco principal, atras do completo
    fed[2]!.historico = [{ descricao: 'Feito dele.', fonte: 'https://exemplo.com/h' }];
    mockarOk(base);
    const tela = await renderParana();
    const grupoFed = [...tela.querySelectorAll('.parana-grupo')].find((s) =>
      s.querySelector('.parana-grupo-titulo')?.textContent?.includes('federais')
    )!;
    const principal = [...grupoFed.querySelectorAll('.parana-grade')].find((g) => !g.closest('.parana-mais'))!;
    expect([...principal.querySelectorAll('.parana-nome')].map((e) => e.textContent)).toEqual([
      'Federal Completo',
      'Federal Basico Dois',
    ]);
    // e o filtro "so com material" deixa passar quem tem historico
    tela.querySelector<HTMLButtonElement>('.parana-filtro-completos')!.click();
    expect(nomesVisiveis(tela)).toContain('Federal Basico Dois');
    expect(nomesVisiveis(tela)).not.toContain('Federal Basico Um');
  });
});

describe('calcularIdade', () => {
  it('1993-11-18 em 2026-09-30 vira 32', () => {
    expect(calcularIdade('1993-11-18', new Date(2026, 8, 30))).toBe(32);
  });

  it('1980-10-31 em 2026-09-30 vira 45 e em 2026-10-31 vira 46', () => {
    expect(calcularIdade('1980-10-31', new Date(2026, 8, 30))).toBe(45);
    expect(calcularIdade('1980-10-31', new Date(2026, 9, 31))).toBe(46);
  });

  it('sem data omite (null) e texto invalido vira null', () => {
    expect(calcularIdade(undefined)).toBeNull();
    expect(calcularIdade('não é data', new Date(2026, 8, 30))).toBeNull();
  });

  it('cartao mostra idade e naturalidade; sem nascimento omite anos', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 30));
    mockarOk(baseFixture());
    const tela = await renderParana();
    vi.useRealTimers();
    const cartaoGov = [...tela.querySelectorAll('.parana-card')].find((c) =>
      c.querySelector('.parana-nome')?.textContent?.includes('Luiz França')
    )!;
    expect(cartaoGov.querySelector('.parana-dados')?.textContent).toBe('32 anos · Cianorte (PR)');
    const cartaoVice = [...tela.querySelectorAll('.parana-card')].find((c) =>
      c.querySelector('.parana-nome')?.textContent?.includes('João Adolfo')
    )!;
    expect(cartaoVice.querySelector('.parana-dados')).toBeNull();
  });
});

describe('classificarCargo', () => {
  it('usa minusculas e includes para cada grupo', () => {
    expect(classificarCargo('Governador')).toBe('gov');
    expect(classificarCargo('Vice-governador')).toBe('gov');
    expect(classificarCargo('Senadora')).toBe('senado');
    expect(classificarCargo('Senador')).toBe('senado');
    expect(classificarCargo('1º suplente de senador')).toBe('senado');
    expect(classificarCargo('2º suplente de senador')).toBe('senado');
    expect(classificarCargo('Deputado Federal')).toBe('federal');
    expect(classificarCargo('Deputado Estadual')).toBe('estadual');
  });
});

describe('tela parana: estados', () => {
  it('erro mostra Tentar de novo e o clique recarrega', async () => {
    const falha = vi.fn(async () => {
      throw new Error('rede');
    });
    vi.stubGlobal('fetch', falha);
    const tela = await renderParana();
    document.body.appendChild(tela);
    expect(tela.textContent).toMatch(/Não foi possível carregar/);
    const btn = [...tela.querySelectorAll('button')].find((b) => b.textContent === 'Tentar de novo')!;
    expect(btn).toBeTruthy();
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => baseFixture() })));
    btn.click();
    await vi.waitFor(() => {
      expect(tela.querySelector('h2')?.textContent).toBe(TITULO_PARANA);
      expect(tela.querySelector('.parana-card')).not.toBeNull();
    });
  });

  it('vazio mostra mensagem discreta', async () => {
    const base = baseFixture();
    base.candidatos = [];
    mockarOk(base);
    const tela = await renderParana();
    expect(tela.textContent).toMatch(/Nenhum candidato cadastrado no momento/);
    expect(tela.querySelector('.parana-card')).toBeNull();
  });

  it('sem botao Voltar ao Inicio', async () => {
    mockarOk(baseFixture());
    const tela = await renderParana();
    const textos = [...tela.querySelectorAll('button, .btn-pill')].map((b) => b.textContent);
    expect(textos).not.toContain('Voltar ao Início');
    expect(tela.querySelector('.parana-footer-actions')).toBeNull();
  });
});

describe('tela parana: presidente e avatar', () => {
  it('grupo Presidente vem antes de Governador', async () => {
    const base = baseFixture();
    base.candidatos.push({
      id: 'pr-pres-14', cargo: 'Presidente', nomeUrna: 'Renan Santos', nomeCompleto: 'Renan Santos',
      numero: '14', partido: 'MISSÃO', situacaoTSE: 'Deferido', bio: 'Bio.', propostas: [], historico: [],
      observacoes: [], fontes: [], lacunas: [], revisar: true,
    });
    mockarOk(base);
    const tela = await renderParana();
    const titulos = [...tela.querySelectorAll('.parana-grupo-titulo')].map((e) => e.textContent);
    expect(titulos[0]).toBe('Presidente');
    expect(titulos[1]).toMatch(/Governador/);
    expect(classificarCargo('Presidente')).toBe('presidente');
    expect(classificarCargo('Vice-presidente')).toBe('outro');
  });

  it('iniciais: primeira e ultima palavra', () => {
    expect(iniciaisDe('Renan Santos')).toBe('RS');
    expect(iniciaisDe('Cher')).toBe('C');
  });

  it('sem foto mostra iniciais; com foto mostra img local com alt e lazy; basico e completo igual', async () => {
    const base = baseFixture();
    base.candidatos[0]!.foto = 'fotos/luiz.jpg';
    mockarOk(base);
    const tela = await renderParana();
    const cartoes = [...tela.querySelectorAll('.parana-card')];
    const gov = cartoes.find((c) => c.querySelector('.parana-nome')?.textContent === 'Luiz França')!;
    const img = gov.querySelector('img')!;
    expect(img.getAttribute('src')).toBe('fotos/luiz.jpg');
    expect(img.getAttribute('alt')).toBe('Luiz França');
    expect(img.getAttribute('loading')).toBe('lazy');
    const semFoto = cartoes.find((c) => c.querySelector('.parana-nome')?.textContent === 'Federal Basico Um')!;
    expect(semFoto.querySelector('.parana-avatar')?.textContent).toMatch(/^[A-Z]{1,2}$/);
    expect(semFoto.querySelector('.parana-cab')).not.toBeNull();
    expect(semFoto.querySelector('.parana-selo')).not.toBeNull();
  });
});

function botaoCargo(tela: HTMLElement, rotulo: string): HTMLButtonElement {
  return [...tela.querySelectorAll<HTMLButtonElement>('.parana-filtro-cargos button')].find((b) =>
    b.textContent?.startsWith(rotulo)
  )!;
}

function nomesVisiveis(tela: HTMLElement): string[] {
  return [...tela.querySelectorAll('.parana-resultado .parana-nome')].map((e) => e.textContent ?? '');
}

describe('tela parana: links de convite', () => {
  it('topo: Monte sua colinha e outros estados, nova aba com noopener', async () => {
    mockarOk(baseFixture());
    const tela = await renderParana();
    const topo = [...tela.querySelectorAll<HTMLAnchorElement>('.parana-acoes a')];
    const colinha = topo.find((a) => a.textContent?.includes('Monte sua colinha'))!;
    expect(colinha.getAttribute('href')).toBe(URL_COLINHA_PR);
    expect(URL_COLINHA_PR).toBe('https://candidatos.missao.org.br/colinha/pr');
    const outros = topo.find((a) => a.textContent?.includes(TEXTO_OUTROS_ESTADOS))!;
    expect(outros.getAttribute('href')).toBe('https://candidatos.missao.org.br/');
    for (const a of [colinha, outros]) {
      expect(a.getAttribute('target')).toBe('_blank');
      expect(a.getAttribute('rel')).toContain('noopener');
    }
  });

  it('bloco do fim leva a candidatos.missao.org.br em nova aba', async () => {
    mockarOk(baseFixture());
    const tela = await renderParana();
    const a = tela.querySelector<HTMLAnchorElement>('.parana-outros a')!;
    expect(a.textContent).toContain('Candidatos da Missão de outros estados');
    expect(a.getAttribute('href')).toBe(URL_MISSAO_CANDIDATOS);
    expect(a.getAttribute('target')).toBe('_blank');
    expect(a.getAttribute('rel')).toBe('noopener noreferrer');
  });
});

describe('filtrarCandidatos', () => {
  it('normaliza acento e caixa', () => {
    expect(normalizarBusca('  Luiz FRANÇA ')).toBe('luiz franca');
  });

  it('por cargo, por nome sem acento, por numero e por completos', () => {
    const { candidatos } = baseFixture();
    const nomes = (l: typeof candidatos) => l.map((c) => c.id);
    expect(filtrarCandidatos(candidatos, FILTRO_INICIAL)).toHaveLength(candidatos.length);
    expect(nomes(filtrarCandidatos(candidatos, { ...FILTRO_INICIAL, cargo: 'federal' }))).toEqual([
      'fed-completo-1',
      'fed-basico-1',
      'fed-basico-2',
    ]);
    expect(nomes(filtrarCandidatos(candidatos, { ...FILTRO_INICIAL, busca: 'franca' }))).toEqual(['gov-1']);
    expect(nomes(filtrarCandidatos(candidatos, { ...FILTRO_INICIAL, busca: '1422' }))).toEqual(['fed-basico-2']);
    expect(
      nomes(filtrarCandidatos(candidatos, { cargo: 'federal', busca: '', soCompletos: true }))
    ).toEqual(['fed-completo-1']);
  });
});

describe('tela parana: filtro na interface', () => {
  it('botoes de cargo com aria-pressed; Todos comeca marcado e mostra a contagem', async () => {
    const base = baseFixture();
    mockarOk(base);
    const tela = await renderParana();
    const rotulos = [...tela.querySelectorAll('.parana-filtro-cargos button')].map((b) => b.firstChild?.textContent);
    expect(rotulos).toEqual(['Todos', 'Governador', 'Senado', 'Federal']);
    expect(botaoCargo(tela, 'Todos').getAttribute('aria-pressed')).toBe('true');
    expect(botaoCargo(tela, 'Senado').getAttribute('aria-pressed')).toBe('false');
    expect(tela.querySelector('.parana-contagem')?.textContent).toBe(`${base.candidatos.length} candidatos`);
    expect(tela.querySelector('label[for="parana-busca"]')).not.toBeNull();
  });

  it('clicar em Federal mostra so federais, atualiza aria-pressed e a contagem', async () => {
    const base = baseFixture();
    mockarOk(base);
    const tela = await renderParana();
    botaoCargo(tela, 'Federal').click();
    expect(botaoCargo(tela, 'Federal').getAttribute('aria-pressed')).toBe('true');
    expect(botaoCargo(tela, 'Todos').getAttribute('aria-pressed')).toBe('false');
    expect(nomesVisiveis(tela)).toEqual(['Federal Completo', 'Federal Basico Um', 'Federal Basico Dois']);
    expect(tela.querySelector('.parana-contagem')?.textContent).toBe(`Mostrando 3 de ${base.candidatos.length} candidatos`);
    expect(tela.querySelectorAll('.parana-grupo').length).toBe(1);
  });

  it('busca por nome e por numero, sem recarregar', async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => baseFixture() }));
    vi.stubGlobal('fetch', fetchMock);
    const tela = await renderParana();
    const campo = tela.querySelector<HTMLInputElement>('#parana-busca')!;
    campo.value = 'karen';
    campo.dispatchEvent(new Event('input'));
    expect(nomesVisiveis(tela)).toEqual(['Karen Guerreiro']);
    campo.value = '1411';
    campo.dispatchEvent(new Event('input'));
    expect(nomesVisiveis(tela)).toEqual(['Federal Basico Um']);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('so com material completo esconde quem nao tem propostas nem historico e o bloco Mais candidatos', async () => {
    mockarOk(baseFixture());
    const tela = await renderParana();
    const botao = tela.querySelector<HTMLButtonElement>('.parana-filtro-completos')!;
    expect(botao.getAttribute('aria-pressed')).toBe('false');
    expect(tela.querySelector('.parana-mais')).not.toBeNull();
    botao.click();
    expect(botao.getAttribute('aria-pressed')).toBe('true');
    expect(tela.querySelector('.parana-mais')).toBeNull();
    expect(nomesVisiveis(tela)).not.toContain('Federal Basico Um');
    expect(nomesVisiveis(tela)).toContain('Federal Completo');
  });

  it('estado vazio amigavel e Limpar filtros restaura tudo, inclusive o campo', async () => {
    const base = baseFixture();
    mockarOk(base);
    const tela = await renderParana();
    const campo = tela.querySelector<HTMLInputElement>('#parana-busca')!;
    campo.value = 'zzzz inexistente';
    campo.dispatchEvent(new Event('input'));
    expect(tela.querySelector('.parana-filtro-vazio')?.textContent).toMatch(/Nenhum candidato com esses filtros/);
    expect(tela.querySelector('.parana-card')).toBeNull();
    const limpar = [...tela.querySelectorAll('button')].find((b) => b.textContent === 'Limpar filtros')!;
    limpar.click();
    expect(campo.value).toBe('');
    expect(tela.querySelector('.parana-filtro-vazio')).toBeNull();
    expect(tela.querySelectorAll('.parana-card').length).toBe(base.candidatos.length);
    expect(botaoCargo(tela, 'Todos').getAttribute('aria-pressed')).toBe('true');
  });

  it('funciona com qualquer mistura: todos completos, sem bloco Mais candidatos', async () => {
    const base = baseFixture();
    for (const c of base.candidatos) {
      c.basico = false;
      c.historico = [{ descricao: 'Feito.', fonte: 'https://exemplo.com/f' }];
    }
    mockarOk(base);
    const tela = await renderParana();
    expect(tela.querySelector('.parana-mais')).toBeNull();
        expect(tela.querySelectorAll('.parana-card').length).toBe(base.candidatos.length);
  });

  it('notas e fontes ficam recolhidas em details', async () => {
    mockarOk(baseFixture());
    const tela = await renderParana();
    const gov = [...tela.querySelectorAll('.parana-card')].find((c) =>
      c.querySelector('.parana-nome')?.textContent === 'Luiz França'
    )!;
    const resumos = [...gov.querySelectorAll('details > summary')].map((e) => e.textContent);
    expect(resumos).toContain('Fontes e notas (2)');
    expect(gov.querySelector('.parana-nota')?.closest('details')).not.toBeNull();
  });
});
