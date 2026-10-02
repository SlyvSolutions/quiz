import * as fs from 'node:fs';
import * as path from 'node:path';

interface TokenValueTheme {
  claro: string;
  escuro: string;
}

interface ColorToken {
  name: string;
  value: TokenValueTheme;
}

interface SimpleToken {
  name: string;
  value: string;
}

export function gerarTokens() {
  const jsonPath = path.join(__dirname, '../../docs/design-system/tokens.json');
  const tokensJson = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  const resolveValue = (val: string) => val.replace(/\{([^}]+)\}/g, 'var(--mq-$1)');

  let tokensCss = '/* ARQUIVO GERADO AUTOMATICAMENTE - NÃO EDITE */\n:root {\n';
  
  if (tokensJson.type && tokensJson.type.families) {
    for (const [key, value] of Object.entries(tokensJson.type.families)) {
      tokensCss += `  --mq-font-${key}: ${resolveValue(value as string)};\n`;
    }
  }

  for (const t of tokensJson.spacing.tokens as SimpleToken[]) {
    tokensCss += `  --mq-${t.name}: ${resolveValue(t.value)};\n`;
  }
  
  for (const t of tokensJson.radius.tokens as SimpleToken[]) {
    tokensCss += `  --mq-${t.name}: ${resolveValue(t.value)};\n`;
  }
  
  for (const t of tokensJson.shadow.tokens as SimpleToken[]) {
    tokensCss += `  --mq-${t.name}: ${resolveValue(t.value)};\n`;
  }
  
  // Tokens de aplicação (escala fluida, bordas, tamanhos, movimento)
  const appJsonPath = path.join(__dirname, '../../docs/design-system/tokens-app.json');
  if (fs.existsSync(appJsonPath)) {
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    for (const t of appJson.tokens as SimpleToken[]) {
      tokensCss += `  --mq-${t.name}: ${resolveValue(t.value)};\n`;
    }
  }

  tokensCss += '}\n';

  let temasCss = '/* ARQUIVO GERADO AUTOMATICAMENTE - NÃO EDITE */\n';
  
  temasCss += ':root, [data-tema="claro"] {\n';
  for (const t of tokensJson.color.tokens as ColorToken[]) {
    temasCss += `  --mq-${t.name}: ${resolveValue(t.value.claro)};\n`;
  }
  temasCss += '}\n\n';

  temasCss += '[data-tema="escuro"] {\n';
  for (const t of tokensJson.color.tokens as ColorToken[]) {
    temasCss += `  --mq-${t.name}: ${resolveValue(t.value.escuro)};\n`;
  }
  temasCss += '}\n';

  const stylesDir = path.join(__dirname, '../src/styles');
  if (!fs.existsSync(stylesDir)) {
    fs.mkdirSync(stylesDir, { recursive: true });
  }

  fs.writeFileSync(path.join(stylesDir, 'tokens.css'), tokensCss);
  fs.writeFileSync(path.join(stylesDir, 'temas.css'), temasCss);
}

if (process.env.VITEST !== 'true' && process.env.NODE_ENV !== 'test') {
  gerarTokens();
}
