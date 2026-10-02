import { lerSessao, salvarSessao } from '../../state/sessao-storage';
import { criarBotaoPill } from '../../ui/botao';
import { criarAvatarNeutro } from '../../ui/avatar';
import { el } from '../../ui/dom';
import { criarAvisoFalhaCandidatos } from '../../ui/aviso';
import { carregarCandidatos, type NomesCandidatos } from '../../data/candidatos';
import { criarContextoRecolhivel } from '../../ui/contexto';
import { revelarBlocos } from '../../motion/entrada-de-bloco';
import { navigate } from '../../app/router';
import { dividirMarcadores } from '../../core/mascarar-texto';

interface Trecho {
  id: string;
  candidato_id: string;
  eixo: string;
  arquivo: string;
  texto_literal: string;
  texto_mascarado: string;
  contexto_literal?: string;
  contexto_linha_inicio?: number;
  contexto_linha_fim?: number;
}


export async function renderRevelacao(): Promise<HTMLElement> {
  const container = el('div', { class: 'screen-revelacao tela' });

  let NOME_CANDIDATOS: NomesCandidatos;
  try {
    NOME_CANDIDATOS = await carregarCandidatos();
  } catch (e) {
    console.error(e);
    container.appendChild(el('div', { class: 'conteudo tela-topo' }, criarAvisoFalhaCandidatos()));
    return container;
  }

  const sessao = lerSessao();
  const ordem = sessao?.ordemCandidatos || [];

  if (ordem.length === 0) {
    const btnVoltar = criarBotaoPill('Voltar', 'secundaria');
    btnVoltar.addEventListener('click', () => navigate('#teste-cego'));
    container.append(
      el(
        'div',
        { class: 'conteudo pilha tela-topo' },
        el('h2', { texto: 'Sessão não encontrada' }),
        el('p', { class: 'lead', texto: 'Por favor, volte e faça o teste cego.' }),
        btnVoltar
      )
    );
    return container;
  }

  // Ver a revelação libera o quiz
  if (sessao && !sessao.revelacaoVista) salvarSessao({ ...sessao, revelacaoVista: true });

  container.appendChild(
    el(
      'header',
      { class: 'tela-topo rev-header' },
      el(
        'div',
        { class: 'conteudo' },
        el('p', { class: 'eyebrow', texto: 'Passo 2 · Os nomes aparecem agora' }),
        el('h2', { texto: 'A Grande Revelação' }),
        el('p', { class: 'lead', texto: 'Aqui estão os autores reais dos planos que você acabou de ordenar.' })
      )
    )
  );

  let trechos: Trecho[] = [];
  let planosCegos: { id: string; apelido_neutro: string }[] = [];
  try {
    const [resTrechos, resCegos] = await Promise.all([
      fetch(import.meta.env.BASE_URL + 'data/trechos.json'),
      fetch(import.meta.env.BASE_URL + 'data/planos_cegos.json'),
    ]);
    if (resTrechos.ok) trechos = await resTrechos.json();
    if (resCegos.ok) planosCegos = await resCegos.json();
  } catch (e) {
    console.warn('Erro ao carregar dados', e);
  }

  const list = el('div', { class: 'conteudo rev-list' });

  ordem.forEach((apelido, index) => {
    // Acha o id do trecho mostrado no teste cego para este apelido
    const cego = planosCegos.find((p) => p.apelido_neutro === apelido);
    if (!cego) return;

    // Acha o trecho original
    const original = trechos.find((t) => t.id === cego.id);
    if (!original) return;

    const info = NOME_CANDIDATOS[original.candidato_id] || { nome: original.candidato_id, partido: '' };

    // Como você leu: o que foi ocultado ([***] ou rótulo de programa) vira uma marca visível
    const lido = el('p');
    let temMascara = false;
    for (const pedaco of dividirMarcadores(original.texto_mascarado)) {
      if (!pedaco.marcado) {
        lido.append(pedaco.texto);
        continue;
      }
      temMascara = true;
      lido.appendChild(el('mark', { class: 'rev-highlight-mask', texto: pedaco.texto }));
    }

    const textoOriginal = el('p');
    if (temMascara) {
      textoOriginal.appendChild(el('mark', { class: 'rev-highlight-orig', texto: original.texto_literal }));
    } else {
      textoOriginal.append(
        original.texto_literal,
        el('br'),
        el('small', { class: 'rev-no-mask', texto: '(Nada foi ocultado neste trecho)' })
      );
    }

    const card = el(
      'article',
      { class: 'rev-card' },
      el(
        'div',
        { class: 'rev-topo' },
        el('div', { class: 'rev-rank-badge', texto: `#${index + 1}` }),
        criarAvatarNeutro(info.nome),
        el(
          'div',
          { class: 'rev-profile-info' },
          el('h3', { texto: info.nome }),
          info.partido ? el('span', { class: 'chip', texto: info.partido }) : null
        )
      ),
      el(
        'div',
        { class: 'rev-columns' },
        el('div', { class: 'rev-col' }, el('h4', { texto: 'Como você leu:' }), lido),
        el(
          'div',
          { class: 'rev-col' },
          el('h4', { texto: 'Texto Original:' }),
          textoOriginal,
          el('a', {
            class: 'rev-link',
            texto: `Ver no TSE (${original.arquivo})`,
            attrs: { href: 'https://divulgacandcontas.tse.jus.br', target: '_blank', rel: 'noopener' },
          })
        )
      ),
      original.contexto_literal
        ? criarContextoRecolhivel(
            'Ver o parágrafo completo no plano original',
            original.contexto_literal,
            original.texto_literal,
            `${original.arquivo} · linhas ${original.contexto_linha_inicio} a ${original.contexto_linha_fim}`
          )
        : null
    );
    list.appendChild(card);
  });

  container.appendChild(list);

  const btnNext = criarBotaoPill('AVANÇAR PARA O QUIZ', 'primaria', { seta: true });
  btnNext.addEventListener('click', () => navigate('#quiz'));
  container.appendChild(el('div', { class: 'conteudo rev-footer', data: { fixo: '' } }, btnNext));

  // Cada card entra em sequência
  requestAnimationFrame(() => revelarBlocos(list, ':scope > *'));

  return container;
}
