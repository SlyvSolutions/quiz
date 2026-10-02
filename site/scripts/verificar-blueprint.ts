import * as fs from 'node:fs';
import * as path from 'node:path';

// Função auxiliar para encontrar todos os arquivos em um diretório
function getFiles(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getFiles(fullPath, fileList);
    } else {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

export function verificarBlueprint(baseDir: string = path.join(__dirname, '../..')): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const srcDir = path.join(baseDir, 'site', 'src');
  const indexHtml = path.join(baseDir, 'site', 'index.html');

  // Logos e outros assets oficiais (SVG) não são código: nunca se edita nem se recolore (design system)
  const assetsDir = path.join(srcDir, 'assets') + path.sep;
  const srcFiles = getFiles(srcDir).filter((f) => !f.startsWith(assetsDir));
  const allFilesToCheck = fs.existsSync(indexHtml) ? [...srcFiles, indexHtml] : srcFiles;

  // Regexes
  const htmlApiRegex = /(innerHTML|outerHTML|insertAdjacentHTML|document\.write)/;
  const externalReqRegex = /(fetch|XMLHttpRequest|sendBeacon|WebSocket).*https?:\/\//;
  const externalScriptRegex = /<(script|link).*https?:\/\//;
  const literalStyleRegex = /#[0-9a-fA-F]{3,6}|\b\d+(px|rem|em|vw|vh)\b/;
  const emojiRegex = /\p{Emoji_Presentation}/u;
  const contrapontoRegex = /contraponto/i;

  for (const filePath of allFilesToCheck) {
    const isIndex = filePath.endsWith('index.html');
    const relPath = path.relative(baseDir, filePath).replace(/\\/g, '/');
    
    // Ignorar tokens gerados da checagem de estilo
    const isTokens = relPath === 'site/src/styles/tokens.css' || relPath === 'site/src/styles/temas.css' || relPath === 'site/src/styles/mobile.css';
    
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      const lineNum = index + 1;

      // BP-004
      if (!isIndex && htmlApiRegex.test(line)) {
        errors.push(`BP-004 [${relPath}:${lineNum}]: Uso de API HTML perigosa (innerHTML etc)`);
      }

      // BP-005
      if (!isIndex && externalReqRegex.test(line)) {
        errors.push(`BP-005 [${relPath}:${lineNum}]: Requisição para origem externa`);
      }

      // BP-006
      if (externalScriptRegex.test(line)) {
        errors.push(`BP-006 [${relPath}:${lineNum}]: Link ou script externo (analytics/fontes)`);
      }

      // BP-010
      if (!isIndex && !isTokens && literalStyleRegex.test(line)) {
        // Ignora comentários e import/url com literais (as vezes arquivos .css tem)
        // Se quisermos ser rigorosos
        errors.push(`BP-010 [${relPath}:${lineNum}]: Cor ou tamanho literal encontrado fora do tokens.css`);
      }

      // BP-012
      if (!isIndex && emojiRegex.test(line)) {
        errors.push(`BP-012 [${relPath}:${lineNum}]: Emoji encontrado`);
      }

      // BP-013
      if (!isIndex && contrapontoRegex.test(line)) {
        errors.push(`BP-013 [${relPath}:${lineNum}]: Palavra "contraponto" encontrada`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

if (process.env.VITEST !== 'true' && process.env.NODE_ENV !== 'test') {
  console.log('Verificando regras do Blueprint (BP-004 a BP-013)...');
  const result = verificarBlueprint();
  if (!result.valid) {
    console.error('❌ Verificação falhou. Padrões proibidos encontrados:');
    result.errors.forEach(err => console.error(err));
    process.exit(1);
  } else {
    console.log('✅ Verificação do Blueprint concluída com sucesso.');
    process.exit(0);
  }
}
