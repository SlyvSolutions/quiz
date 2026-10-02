import { TOTAL_PERGUNTAS } from '../core/jornada';

export interface ResultadoShare {
  ranking: { nome: string; afinidade: number }[];
  /** perguntas do quiz da sessão; sem isso vale o total padrão */
  total?: number;
}

export function gerarTextoCompartilhamento(resultado: ResultadoShare): string {
  let texto = `Minha concordância com ${resultado.total ?? TOTAL_PERGUNTAS} trechos no Missão Quiz:\n\n`;
  
  resultado.ranking.forEach((item, index) => {
    texto += `${index + 1}º ${item.nome} - ${item.afinidade.toFixed(0)}%\n`;
  });
  
  texto += '\nNão é recomendação de voto. Faça o teste cego também: https://missao-quiz.com.br';
  return texto;
}
