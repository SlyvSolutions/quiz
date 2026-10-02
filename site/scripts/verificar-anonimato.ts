import { execSync } from 'node:child_process';

// BP-011: nenhum nome pessoal, e-mail pessoal ou contato pessoal em arquivo versionado.
// Autoria pública é só "apoiadores do Partido Missão" e a conta GitHub SlyvSolutions.
//
// Os termos proibidos são montados por partes para que este arquivo (e seu teste) não
// se apontem a si mesmos na busca.
const NOME = 'ma' + 'ia';
const USUARIO = 'cmj' + NOME;
const EMAIL = 'g' + 'mail';

// O nome solto só conta como palavra inteira: sem isso, sequências base64 de fontes
// embutidas em design/ (ex.: "...u9zpPyDA0...") geram falso positivo.
const SEPARADOR = '[^[:alnum:]+/]';
const PADRAO = `(^|${SEPARADOR})${NOME}(${SEPARADOR}|$)|${USUARIO}|${EMAIL}`;

// Fora da verificação:
//  - .sled/ guarda os logs de auditoria imutáveis do sistema de governança (cada versão de
//    artefato é copiada e tem integridade verificada). Editar ali quebra a auditoria, então
//    o dono do projeto decide o que fazer com essas ocorrências.
//  - docs/sdm/phase-3-task-breakdown.yaml é a cópia do artefato de fase que descreve esta
//    própria regra (cita os termos proibidos para explicá-la) e também é espelho do .sled.
const EXCLUIDOS = [
  ':(top,exclude).sled',
  ':(top,exclude)docs/sdm/phase-3-task-breakdown.yaml',
];

export function verificarAnonimato(): void {
  const comando = `git grep -n -I -i -E -e "${PADRAO}" -- ':/' ${EXCLUIDOS.map(e => `'${e}'`).join(' ')}`;
  let resultado = '';
  try {
    resultado = execSync(comando, { encoding: 'utf-8', maxBuffer: 64 * 1024 * 1024 });
  } catch (error) {
    // git grep sai com 1 quando não acha nada; qualquer outro código é falha real.
    const status = (error as { status?: number }).status;
    if (status !== 1) {
      console.error('Erro ao executar git grep:', error);
      process.exit(1);
      return;
    }
  }

  if (resultado.trim().length > 0) {
    console.error('ERRO: Foram encontrados nomes pessoais nos arquivos rastreados. O projeto deve ser anônimo (BP-011).');
    console.error(resultado);
    process.exit(1);
  } else {
    console.log('OK: Nenhum nome pessoal encontrado nos arquivos.');
    process.exit(0);
  }
}

if (process.env.VITEST !== 'true' && process.env.NODE_ENV !== 'test') {
  console.log('Verificando anonimato dos arquivos versionados...');
  verificarAnonimato();
}
