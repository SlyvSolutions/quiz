import { RESPOSTA_PULAR } from './votos';

export class SessaoQuiz {
  public atual: number = 0;
  public respostas = new Map<number, string>();
  public concluido: boolean = false;

  constructor(public total: number = 10) {}

  iniciar() {
    this.atual = 1;
    this.concluido = false;
    this.respostas.clear();
  }

  responder(pergunta: number, resposta: string) {
    if (pergunta < 1 || pergunta > this.total) return;
    
    this.respostas.set(pergunta, resposta);
    
    if (this.respostas.size === this.total || pergunta === this.total) {
      this.concluido = true;
    }
    
    if (this.atual === pergunta && !this.concluido) {
      this.atual = Math.min(this.atual + 1, this.total);
    }
  }

  pular(pergunta: number) {
    this.responder(pergunta, RESPOSTA_PULAR);
  }

  voltar() {
    if (this.concluido) {
      this.concluido = false;
    } else if (this.atual > 0) {
      this.atual--;
    }
  }
}
