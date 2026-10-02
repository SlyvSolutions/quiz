import { normalizarTexto } from './normalizar-texto';

export interface ResultadoMascara {
  valido: boolean;
  nadaOcultado: boolean;
  ocultados: string[];
}

export function conferirMascara(original: string, mascarado: string, marcador: string = '[***]'): ResultadoMascara {
  const normOriginal = normalizarTexto(original);
  const normMascarado = normalizarTexto(mascarado);

  if (!normMascarado.includes(marcador)) {
    if (normOriginal === normMascarado) {
      return { valido: true, nadaOcultado: true, ocultados: [] };
    }
    return { valido: false, nadaOcultado: false, ocultados: [] };
  }

  // Escapar caracteres especiais de regex
  const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  const partes = normMascarado.split(marcador);
  const partesEscapadas = partes.map(escapeRegex);
  
  // Criar regex de validação: ^parte1(.*?)parte2(.*?)parte3$
  const padrao = '^' + partesEscapadas.join('(.*?)') + '$';
  // usar 's' flag para permitir que (.*?) dê match em quebras de linha caso normalização falhe (embora a normalização deva ter removido)
  // e 'i' para case insensitive? Não, a validação é literal, logo case sensitive, exceto normalização de espaços
  const regex = new RegExp(padrao);
  
  const match = normOriginal.match(regex);
  
  if (!match) {
    return { valido: false, nadaOcultado: false, ocultados: [] };
  }
  
  const ocultados = match.slice(1);
  
  return {
    valido: true,
    nadaOcultado: false,
    ocultados
  };
}
