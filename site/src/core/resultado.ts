import { RESPOSTA_PULAR } from './votos';

export interface ResultadoAfinidade {
  totalValidas: number;
  basePequena: boolean;
  percentuais: Record<string, number>;
  vencedores: string[];
}

export function calcularResultado(respostas: string[], candidatosValidos: string[]): ResultadoAfinidade {
  const contagem: Record<string, number> = {};
  let totalValidas = 0;

  for (const resp of respostas) {
    if (!resp || resp === RESPOSTA_PULAR) continue;
    
    // Opção inexistente é descartada
    if (!candidatosValidos.includes(resp)) continue;

    contagem[resp] = (contagem[resp] || 0) + 1;
    totalValidas++;
  }

  const basePequena = totalValidas < 5;
  const percentuais: Record<string, number> = {};
  
  if (totalValidas === 0) {
    return { 
      totalValidas, 
      basePequena, 
      percentuais, 
      vencedores: [] 
    };
  }

  let maxVotos = 0;
  for (const cand of Object.keys(contagem)) {
    percentuais[cand] = (contagem[cand]! / totalValidas) * 100;
    if (contagem[cand]! > maxVotos) {
      maxVotos = contagem[cand]!;
    }
  }

  const vencedores = Object.keys(contagem).filter(c => contagem[c] === maxVotos);

  return {
    totalValidas,
    basePequena,
    percentuais,
    vencedores
  };
}
