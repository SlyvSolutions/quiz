import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import type { ManifestoIntegridade } from '../src/data/tipos';

export interface ManifestoFull {
  gerado_em: string;
  arquivos: ManifestoIntegridade[];
}

export function calcularHash(caminhoAbsoluto: string): string {
  const buffer = fs.readFileSync(caminhoAbsoluto);
  const hash = crypto.createHash('sha256');
  hash.update(buffer);
  return hash.digest('hex');
}

export function listarArquivos(dir: string, baseDir: string = dir): string[] {
  let resultados: string[] = [];
  if (!fs.existsSync(dir)) return resultados;
  
  const lista = fs.readdirSync(dir).sort();
  for (const item of lista) {
    const absoluto = path.join(dir, item);
    const stat = fs.statSync(absoluto);
    if (stat.isDirectory()) {
      resultados = resultados.concat(listarArquivos(absoluto, baseDir));
    } else {
      // Ignorar o próprio manifesto
      if (item === 'manifesto.json') continue;
      // Retornar caminho relativo
      resultados.push(path.relative(baseDir, absoluto).replace(/\\/g, '/'));
    }
  }
  return resultados;
}

export function gerarManifesto(publicDir: string): ManifestoFull {
  const arquivos = listarArquivos(publicDir);
  const manifesto: ManifestoIntegridade[] = arquivos.map(arq => {
    const absoluto = path.join(publicDir, arq);
    return {
      arquivo: arq,
      sha256: calcularHash(absoluto)
    };
  });

  return {
    gerado_em: new Date().toISOString(),
    arquivos: manifesto
  };
}

export function verificarManifesto(publicDir: string, manifestoAtual: ManifestoFull): string[] {
  const erros: string[] = [];
  const arquivosFisicos = listarArquivos(publicDir);
  
  const mapaManifesto = new Map<string, string>();
  for (const item of manifestoAtual.arquivos) {
    mapaManifesto.set(item.arquivo, item.sha256);
  }

  for (const arq of arquivosFisicos) {
    if (!mapaManifesto.has(arq)) {
      erros.push(`ARQUIVO_NAO_LISTADO: O arquivo '${arq}' está na pasta public, mas não consta no manifesto.`);
    } else {
      const hashReal = calcularHash(path.join(publicDir, arq));
      if (hashReal !== mapaManifesto.get(arq)) {
        erros.push(`HASH_INVALIDO: O arquivo '${arq}' foi modificado (hash diferente do manifesto).`);
      }
    }
  }

  return erros;
}

if (process.env.VITEST !== 'true' && process.env.NODE_ENV !== 'test') {
  const publicDir = path.join(__dirname, '../public');
  const manifestoPath = path.join(publicDir, 'manifesto.json');

  const args = process.argv.slice(2);
  const isCheckMode = args.includes('--check');

  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  if (isCheckMode) {
    console.log('Verificando integridade do manifesto...');
    if (!fs.existsSync(manifestoPath)) {
      console.error('ARQUIVO_INEXISTENTE: manifesto.json não encontrado.');
      process.exit(1);
    }

    const manifesto: ManifestoFull = JSON.parse(fs.readFileSync(manifestoPath, 'utf-8'));
    const erros = verificarManifesto(publicDir, manifesto);

    if (erros.length > 0) {
      console.error('❌ Falha na validação do manifesto (código != 0):');
      erros.forEach(e => console.error(e));
      process.exit(1);
    } else {
      console.log('✅ Manifesto validado com sucesso.');
      process.exit(0);
    }
  } else {
    console.log('Gerando manifesto.json...');
    const novoManifesto = gerarManifesto(publicDir);
    // Se nada mudou desde o manifesto atual, mantém a data de geração para não sujar o git a cada build.
    if (fs.existsSync(manifestoPath)) {
      try {
        const atual: ManifestoFull = JSON.parse(fs.readFileSync(manifestoPath, 'utf-8'));
        if (JSON.stringify(atual.arquivos) === JSON.stringify(novoManifesto.arquivos)) {
          novoManifesto.gerado_em = atual.gerado_em;
        }
      } catch {
        // manifesto atual ilegível: segue com o novo
      }
    }
    fs.writeFileSync(manifestoPath, JSON.stringify(novoManifesto, null, 2) + '\n', 'utf-8');
    console.log('✅ manifesto.json gerado com sucesso.');
    process.exit(0);
  }
}
