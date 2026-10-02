import { TOTAL_PERGUNTAS } from '../core/jornada';

/** Endereço público do site, usado no texto e na imagem de compartilhamento. */
export const URL_SITE = 'https://slyvsolutions.github.io/quiz/';
/** O mesmo endereço sem o protocolo, para caber na imagem. */
export const URL_SITE_CURTA = 'slyvsolutions.github.io/quiz';

export interface ResultadoShare {
  ranking: { nome: string; afinidade: number }[];
  /** perguntas do quiz da sessão; sem isso vale o total padrão */
  total?: number;
}

export function gerarTextoCompartilhamento(resultado: ResultadoShare): string {
  let texto = `Minha concordância com ${resultado.total ?? TOTAL_PERGUNTAS} trechos dos planos de governo:\n\n`;
  
  resultado.ranking.forEach((item, index) => {
    texto += `${index + 1}º ${item.nome} - ${item.afinidade.toFixed(0)}%\n`;
  });
  
  texto += '\nNão é recomendação de voto. Faça o teste cego também: ' + URL_SITE;
  return texto;
}
