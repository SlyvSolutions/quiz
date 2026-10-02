import * as fs from 'node:fs';
import * as path from 'node:path';
import crypto from 'node:crypto';
import { localizarTrecho } from './extrair-trecho';
import { expandirContexto } from './contexto';
import { mascararTexto } from '../src/core/mascarar-texto';

function hashSHA256(texto: string): string {
  return crypto.createHash('sha256').update(texto).digest('hex');
}

function normalizeId(candId: string, eixo: string): string {
  return `${candId}-${eixo.toLowerCase().replace('ç', 'c')}`;
}

const candidatos = {
  lula: {
    arquivo: '../Planos_TSE/Lula_Plano_Original.md',
    trechos: {
      Segurança: 'O compromisso do governo Lula é proteger a vida, garantir a cidadania e assegurar a presença do Estado onde a violência e o crime organizado tentam impor o medo e controlar territórios.',
      Economia: 'A taxa de juros é hoje o que a inflação foi no passado no Brasil: promove concentração de renda e desorganiza a nossa economia.',
      Educação: 'Lançamos o MEC Livros e o MEC Idiomas, iniciativas que, ao permitir o acesso via celular, democratizam o acesso a leitura e aprendizagem de inglês e espanhol.',
      Reformas: 'Aprovamos a histórica reforma tributária do consumo. O número de impostos cairá de cinco (PIS, Cofins, IPI, ICMS e ISS) para dois (CBS federal e IBS subnacional).',
      Saúde: 'Com Lula, o SUS voltou a estar ao lado do povo brasileiro. A atenção básica, como eixo estruturante do sistema, foi apoiada na expansão de serviços'
    }
  },
  flavio: {
    arquivo: '../Planos_TSE/Flavio_Plano_Original.md',
    trechos: {
      Segurança: 'Assim, fica difícil combater o crime. Quem tem que viver em paz é o cidadão de bem, não as facções do mal.',
      Economia: 'Foram 30 aumentos de tributos, a inflação de alimentos fora de controle e a maior taxa de juros em 19 anos.',
      Educação: 'A criança que não é alfabetizada na idade certa vira o adolescente que passa de série sem entender a matéria e o jovem que termina a escola sem saber o suficiente para conseguir um bom emprego.',
      Reformas: 'Ao contrário do PT, o nosso projeto é de país, não de poder. Já existe uma PEC protocolada no Senado Federal com essa proposta, de autoria do senador e futuro presidente do Brasil, Flávio Bolsonaro.',
      Saúde: 'A saúde mental é outra face do cuidado, e hoje pesa sobre milhões de famílias, quase sempre em silêncio.'
    }
  },
  caiado: {
    arquivo: '../Planos_TSE/Caiado_Plano_Original.md',
    trechos: {
      Segurança: 'As facções já atuam em todas as unidades da Federação e exploram divisas estaduais, fronteiras internacionais, portos, aeroportos, rios e corredores logísticos.',
      Economia: 'O país deverá trabalhar para que o investimento total avance dos atuais cerca de 17% do PIB em direção a aproximadamente 25%, com participação relevante do investimento público das três esferas',
      Educação: 'Os resultados da educação básica mostram queda acentuada da aprendizagem ao longo da trajetória escolar.',
      Reformas: 'A eleição proporcional por lista aberta, adotada para deputados e vereadores, combina distritos de grande extensão, disputa entre candidatos do mesmo partido, campanhas caras e reduzida conexão entre o parlamentar e uma comunidade definida de eleitores.',
      Saúde: 'O Brasil construiu um dos maiores sistemas universais de saúde do mundo. O SUS é patrimônio nacional, expressão concreta do direito à saúde e uma infraestrutura estratégica que alcança todos os brasileiros.'
    }
  },
  renan: {
    arquivo: '../Planos_TSE/Renan_Plano_Original.md',
    trechos: {
      Segurança: 'A implementação prática do DPI no Brasil se daria por sucessivos decretos de Estado de Defesa em áreas sob comando das facções para realização de operações de retomada territorial',
      Economia: 'Ao mesmo tempo, os gastos com assistencialismo (somando apenas o Bolsa Família e o BPC) aumentaram mais de 8 vezes no mesmo período, chegando em 2025 a cerca de R$ 285 bilhões.',
      Educação: 'não atingiram os requisitos mínimos de conhecimento em matemática para o exercício pleno da cidadania.',
      Reformas: 'Instituição de um sistema de metas baseado em três famílias de indicadores: resultados setoriais (IDEB, cobertura vacinal, saneamento, crescimento econômico), integridade de gestão e eficiência fiscal.',
      Saúde: 'Em enquetes sobre os principais problemas do país, saúde é um dos problemas campeões, especialmente entre as mulheres.'
    }
  },
  cury: {
    trechos: [
      { eixo: 'Segurança', query: 'O combate ao crime organizado exige atuação coordenada entre União, Estados e Municípios. Promoveremos integração plena entre Polícia Federal, Polícias Civis, Polícias Militares, Guardas Municipais', arquivo: '../Planos_TSE/Cury_Plano_Original2-2.md' },
      { eixo: 'Economia', query: 'O Estado e o mercado devem servir ao ser humano, nunca o substituir. Quando o Estado se torna absoluto, sufoca a liberdade. Quando o mercado se torna absoluto, sufoca a compaixão.', arquivo: '../Planos_TSE/Cury_Plano_Original1-2.md' },
      { eixo: 'Educação', query: 'Educar para pensar é educar para existir. A escola do futuro não pode ser apenas uma fábrica de notas. Precisa ser uma academia de formação do Eu.', arquivo: '../Planos_TSE/Cury_Plano_Original1-2.md' },
      { eixo: 'Reformas', query: 'A idade mínima para nomeação será de 50 anos, e o indicado não poderá ter sido filiado a partido político nos cinco anos anteriores à nomeação.', arquivo: '../Planos_TSE/Cury_Plano_Original1-2.md' },
      { eixo: 'Saúde', query: 'A saúde é o bem mais precioso de uma nação. No entanto, milhões de brasileiros ainda enfrentam longas filas, dificuldade para conseguir consultas, falta de especialistas e enormes desigualdades de acesso entre regiões.', arquivo: '../Planos_TSE/Cury_Plano_Original1-2.md' }
    ]
  }
};

const dadosJson: any[] = [];

function camposDeContexto(conteudo: string, loc: { linha_inicio: number; linha_fim: number }, trecho: string) {
  const ctx = expandirContexto(conteudo.split(/\r?\n/), loc.linha_inicio, loc.linha_fim, trecho);
  return {
    contexto_literal: ctx.texto,
    contexto_mascarado: mascararTexto(ctx.texto),
    contexto_linha_inicio: ctx.linha_inicio,
    contexto_linha_fim: ctx.linha_fim,
    hash_contexto: hashSHA256(ctx.texto),
  };
}
const cacheArquivos: Record<string, string> = {};

function lerArquivo(nome: string) {
  if (!cacheArquivos[nome]) {
    cacheArquivos[nome] = fs.readFileSync(path.join(import.meta.dirname, '..', nome), 'utf-8');
  }
  return cacheArquivos[nome];
}

for (const [candId, data] of Object.entries(candidatos)) {
  if (candId === 'cury') {
    const curyData = data as any;
    for (const item of curyData.trechos) {
      const conteudo = lerArquivo(item.arquivo);
      const loc = localizarTrecho(conteudo, item.query);
      if (!loc) throw new Error(`Não achou cury ${item.eixo}: ${item.query}`);
      dadosJson.push({
        id: normalizeId(candId, item.eixo),
        candidato_id: candId,
        eixo: item.eixo,
        arquivo: path.basename(item.arquivo),
        linha_inicio: loc.linha_inicio,
        linha_fim: loc.linha_fim,
        pagina_pdf: loc.pagina_pdf,
        texto_literal: item.query,
        texto_mascarado: mascararTexto(item.query),
        hash_texto: hashSHA256(item.query),
        ...camposDeContexto(conteudo, loc, item.query)
      });
    }
  } else {
    const candData = data as any;
    const conteudo = lerArquivo(candData.arquivo);
    for (const [eixo, query] of Object.entries(candData.trechos)) {
      const loc = localizarTrecho(conteudo, query as string);
      if (!loc) throw new Error(`Não achou ${candId} ${eixo}: ${query}`);
      dadosJson.push({
        id: normalizeId(candId, eixo),
        candidato_id: candId,
        eixo,
        arquivo: path.basename(candData.arquivo),
        linha_inicio: loc.linha_inicio,
        linha_fim: loc.linha_fim,
        pagina_pdf: loc.pagina_pdf,
        texto_literal: query,
        texto_mascarado: mascararTexto(query as string),
        hash_texto: hashSHA256(query as string),
        ...camposDeContexto(conteudo, loc, query as string)
      });
    }
  }
}

const outputPath = path.join(import.meta.dirname, '..', 'public', 'data', 'trechos.json');
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(dadosJson, null, 2));
console.log('trechos.json gerado com sucesso!');
