import '../styles/app.css';
import { initRouter } from './router';
import { criarCabecalho } from './cabecalho';
import { criarRodape } from './rodape';
import { iniciarCliques } from '../motion/clique';

export function bootstrap() {
  const app = document.getElementById('app');
  const view = document.getElementById('router-view');
  if (!app || !view) return;

  app.insertBefore(criarCabecalho(), view);
  app.appendChild(criarRodape());
  iniciarCliques();
  initRouter();
}

// Inicializa a aplicação se estiver no navegador
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', bootstrap);
}
