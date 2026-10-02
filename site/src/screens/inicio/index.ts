import { lerSessao, reiniciarJornada } from '../../state/sessao-storage';
import { criarWizard } from './wizard';
import { lerSlideSalvo } from './wizard-state';
import { navigate } from '../../app/router';

function comecarTeste(destino: string): void {
  reiniciarJornada();
  navigate(destino);
}

export function renderInicio(): HTMLElement {
  const sessao = lerSessao();
  void sessao;
  return criarWizard(lerSlideSalvo(), { aoComecar: comecarTeste, aoPular: () => comecarTeste('#teste-cego') });
}
