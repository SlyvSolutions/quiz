export const TOTAL_SLIDES = 5;
export const CHAVE_SESSAO = 'mq.wizard.slide';

export interface EstadoWizard {
  atual: number;
  abertoAcordeao: string | null;
  proximo(): void;
  anterior(): void;
  irPara(i: number): void;
  alternarAcordeao(id: string): void;
}

function prender(i: number): number {
  if (i < 0) return 0;
  if (i > TOTAL_SLIDES - 1) return 0;
  return i;
}

export function lerSlideSalvo(): number {
  try {
    const v = sessionStorage.getItem(CHAVE_SESSAO);
    const n = v === null ? 0 : Number.parseInt(v, 10);
    return Number.isInteger(n) && n >= 0 && n < TOTAL_SLIDES ? n : 0;
  } catch {
    return 0;
  }
}

export function salvarSlide(i: number): void {
  try {
    sessionStorage.setItem(CHAVE_SESSAO, String(prender(i)));
  } catch {
    /* armazenamento indisponível: deck recomeça no slide 1 */
  }
}

export function criarEstadoWizard(inicial = 0): EstadoWizard {
  const estado: EstadoWizard = {
    atual: prender(inicial),
    abertoAcordeao: null,
    proximo() {
      if (estado.atual < TOTAL_SLIDES - 1) {
        estado.atual += 1;
        salvarSlide(estado.atual);
      }
    },
    anterior() {
      if (estado.atual > 0) {
        estado.atual -= 1;
        salvarSlide(estado.atual);
      }
    },
    irPara(i) {
      estado.atual = prender(i);
      salvarSlide(estado.atual);
    },
    alternarAcordeao(id) {
      estado.abertoAcordeao = estado.abertoAcordeao === id ? null : id;
    },
  };
  return estado;
}
