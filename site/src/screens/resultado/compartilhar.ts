import { lerSessao } from '../../state/sessao-storage';
import { criarBotaoPill } from '../../ui/botao';
import { criarOnca } from '../../ui/logo';
import { el } from '../../ui/dom';
import { criarAvisoFalhaCandidatos } from '../../ui/aviso';
import { carregarCandidatos, type NomesCandidatos } from '../../data/candidatos';
import { navigate } from '../../app/router';
import { gerarBlobDeElemento } from '../../share/imagem';
import { NOME_ARQUIVO, baixarImagem, compartilharImagem, podeCompartilharArquivo } from '../../share/enviar';
import { TOTAL_PERGUNTAS } from '../../core/jornada';
import { gerarTextoCompartilhamento, URL_SITE_CURTA } from '../../share/texto';

interface Trecho {
  id: string;
  candidato_id: string;
}


export async function renderCompartilhar(): Promise<HTMLElement> {
  const container = el('div', { class: 'screen-compartilhar tela' });

  let NOME_CANDIDATOS: NomesCandidatos;
  try {
    NOME_CANDIDATOS = await carregarCandidatos();
  } catch (e) {
    console.error(e);
    container.appendChild(criarAvisoFalhaCandidatos());
    return container;
  }

  const sessao = lerSessao();
  if (!sessao) {
    container.appendChild(el('h2', { texto: 'Sessão não encontrada' }));
    return container;
  }
  const total = sessao.perguntasQuiz?.length || TOTAL_PERGUNTAS;

  // Os votos do quiz por subtemas apontam para trechos_quiz.json; os do teste cego, para trechos.json
  const carregarTrechos = async (arquivo: string): Promise<Trecho[]> => {
    try {
      const res = await fetch(import.meta.env.BASE_URL + 'data/' + arquivo);
      return res.ok ? ((await res.json()) as Trecho[]) : [];
    } catch (e) {
      console.error(e);
      return [];
    }
  };
  const trechosOriginais = (await carregarTrechos('trechos.json')).concat(await carregarTrechos('trechos_quiz.json'));

  const respostas = Object.values(sessao.respostasQuiz).filter((r) => r !== 'pular');
  const totalValidas = respostas.length;

  const votosPorCandidato: Record<string, string[]> = {};
  Object.keys(NOME_CANDIDATOS).forEach((c) => (votosPorCandidato[c] = []));

  respostas.forEach((trechoId) => {
    const original = trechosOriginais.find((t) => t.id === trechoId);
    const lista = original ? votosPorCandidato[original.candidato_id] : undefined;
    if (lista) lista.push(trechoId);
  });

  const ranking = Object.entries(votosPorCandidato)
    .map(([candidato_id, votos]) => {
      const info = NOME_CANDIDATOS[candidato_id];
      return {
        nome: info ? info.nome : candidato_id,
        afinidade: totalValidas > 0 ? (votos.length / totalValidas) * 100 : 0,
      };
    })
    .sort((a, b) => b.afinidade - a.afinidade);

  // Elemento que será printado. Leva o próprio tema escuro para a imagem sair igual à tela.
  const printArea = el(
    'div',
    { class: 'comp-print-area', data: { tema: 'escuro' } },
    el('div', { class: 'comp-logo' }, criarOnca()),
    el('h3', { class: 'comp-title', texto: `Minha concordância com ${total} trechos` }),
    el('p', {
      class: 'comp-aviso-print',
      texto: `Não é recomendação de voto: é um espelho das suas escolhas em ${total} frases.`,
    }),
    el(
      'div',
      { class: 'comp-rank-list' },
      ...ranking.map((cand, idx) =>
        el(
          'div',
          { class: 'comp-cand-row' },
          el('div', { class: 'comp-cand-nome', texto: `#${idx + 1} ${cand.nome}` }),
          el('div', { class: 'comp-cand-pct', texto: `${cand.afinidade.toFixed(0)}%` })
        )
      )
    ),
    el(
      'div',
      { class: 'comp-print-footer' },
      'Faça o seu teste em: ',
      el('strong', { texto: URL_SITE_CURTA })
    )
  );

  container.appendChild(
    el(
      'header',
      { class: 'pilha centro' },
      el('p', { class: 'eyebrow', texto: 'Compartilhar' }),
      el('h2', { class: 'sr-only', texto: 'Compartilhar meu resultado' })
    )
  );

  container.appendChild(printArea);

  const status = el('p', { class: 'comp-status', attrs: { role: 'status' } });

  // A imagem é gerada em segundo plano assim que a tela abre: o toque em Compartilhar já a encontra pronta,
  // e o navegador só abre a folha de compartilhamento se isso acontecer logo após o toque.
  let imagem: Promise<Blob | null> | null = null;
  const preparar = (): Promise<Blob | null> => (imagem ??= gerarBlobDeElemento(printArea));
  window.setTimeout(() => {
    if (printArea.isConnected) void preparar();
  }, 1200);

  const texto = gerarTextoCompartilhamento({ ranking, total });

  /** Roda a ação do botão com o estado "gerando"; sem imagem, copia o resultado como texto. */
  const executar = (botao: HTMLButtonElement, acao: (blob: Blob) => Promise<string>) => async () => {
    const rotulo = botao.textContent;
    botao.textContent = 'Gerando...';
    botao.disabled = true;
    botao.setAttribute('aria-busy', 'true');
    status.textContent = '';
    const blob = await preparar();
    if (blob) {
      try {
        status.textContent = await acao(blob);
      } catch (e) {
        console.error(e);
        status.textContent = 'Não foi possível compartilhar. Use "Baixar imagem".';
      }
    } else {
      imagem = null;
      try {
        await navigator.clipboard.writeText(texto);
        status.textContent = 'Não foi possível gerar a imagem, mas copiamos seu resultado como texto.';
      } catch {
        status.textContent = 'Não foi possível gerar a imagem nem copiar o texto do resultado.';
      }
    }
    botao.textContent = rotulo;
    botao.disabled = false;
    botao.removeAttribute('aria-busy');
  };

  const podeCompartilhar = podeCompartilharArquivo();

  const btnBaixar = criarBotaoPill('Baixar imagem', podeCompartilhar ? 'secundaria' : 'primaria');
  btnBaixar.addEventListener(
    'click',
    executar(btnBaixar, async (blob) => {
      baixarImagem(blob, NOME_ARQUIVO);
      return 'Imagem baixada.';
    })
  );

  const btnCompartilhar = podeCompartilhar ? criarBotaoPill('Compartilhar', 'primaria') : null;
  btnCompartilhar?.addEventListener(
    'click',
    executar(btnCompartilhar, async (blob) => {
      const r = await compartilharImagem({ blob, nomeArquivo: NOME_ARQUIVO, texto });
      return r === 'compartilhado' ? 'Pronto! Resultado compartilhado.' : '';
    })
  );

  const btnVoltar = criarBotaoPill('Voltar', 'secundaria');
  btnVoltar.addEventListener('click', () => navigate('#resultado'));

  container.appendChild(
    el('div', { class: 'comp-actions' }, ...(btnCompartilhar ? [btnCompartilhar] : []), btnBaixar, btnVoltar, status)
  );

  return container;
}
