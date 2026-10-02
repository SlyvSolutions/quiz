export interface ResultadoContraste {
  houveContraste: boolean;
  mensagem: string | null;
}

export function gerarContraste(candidatosAfinidade: string[], candidatoPlanoCego: string | null): ResultadoContraste {
  // Sessão sem voto no teste cego devolve só a afinidade (não gera frase de contraste)
  if (!candidatoPlanoCego) {
    return { houveContraste: false, mensagem: null };
  }

  if (candidatosAfinidade.length === 0) {
    return { houveContraste: false, mensagem: null };
  }

  // Mesmo candidato não gera frase
  if (candidatosAfinidade.includes(candidatoPlanoCego)) {
    return { houveContraste: false, mensagem: null };
  }

  // Plano e candidato diferentes geram a frase de contraste sem juízo de valor
  // Ex: "Você escolheu o plano de João, mas suas respostas indicam maior afinidade com Maria."
  // Se houver empate: "Você escolheu o plano de João, mas suas respostas indicam maior afinidade com Maria e José."
  
  let afinidadeTexto = '';
  if (candidatosAfinidade.length === 1) {
    afinidadeTexto = candidatosAfinidade[0]!;
  } else if (candidatosAfinidade.length === 2) {
    afinidadeTexto = `${candidatosAfinidade[0]} e ${candidatosAfinidade[1]}`;
  } else {
    const ultimos = candidatosAfinidade.slice(-2).join(' e ');
    const primeiros = candidatosAfinidade.slice(0, -2).join(', ');
    afinidadeTexto = `${primeiros}, ${ultimos}`;
  }

  return {
    houveContraste: true,
    mensagem: `No teste cego você escolheu o plano de ${candidatoPlanoCego}, mas suas respostas têm maior afinidade com ${afinidadeTexto}.`
  };
}
