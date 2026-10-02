import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { verificarBlueprint } from '../../scripts/verificar-blueprint';

describe('verificar-blueprint', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'missao-test-'));
    fs.mkdirSync(path.join(tmpDir, 'site', 'src'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, 'site', 'src/styles'), { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('deve passar quando todos os padrões forem respeitados', () => {
    fs.writeFileSync(path.join(tmpDir, 'site', 'index.html'), '<html><body><script src="/local.js"></script></body></html>');
    fs.writeFileSync(path.join(tmpDir, 'site', 'src/app.ts'), 'const x = "var(--mq-amarelo)"; fetch("/data/foo.json");');
    fs.writeFileSync(path.join(tmpDir, 'site', 'src/styles/tokens.css'), ':root { --mq-amarelo: #FCBE26; }'); // Exceção permitida

    const result = verificarBlueprint(tmpDir);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('deve falhar para BP-004 (innerHTML)', () => {
    fs.writeFileSync(path.join(tmpDir, 'site', 'src/app.ts'), 'div.innerHTML = "foo";');
    const result = verificarBlueprint(tmpDir);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('BP-004'))).toBe(true);
  });

  it('deve falhar para BP-005 (fetch externo)', () => {
    fs.writeFileSync(path.join(tmpDir, 'site', 'src/app.ts'), 'fetch("https://api.exemplo.com");');
    const result = verificarBlueprint(tmpDir);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('BP-005'))).toBe(true);
  });

  it('deve falhar para BP-006 (analytics/webfont em index.html)', () => {
    fs.writeFileSync(path.join(tmpDir, 'site', 'index.html'), '<script src="https://google-analytics.com/analytics.js"></script>');
    const result = verificarBlueprint(tmpDir);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('BP-006'))).toBe(true);
  });

  it('deve falhar para BP-010 (cor/tamanho literal em CSS fora de tokens)', () => {
    fs.writeFileSync(path.join(tmpDir, 'site', 'src/App.css'), '.btn { background: #FF0000; padding: 10px; }');
    const result = verificarBlueprint(tmpDir);
    expect(result.valid).toBe(false);
    expect(result.errors.filter(e => e.includes('BP-010')).length).toBeGreaterThanOrEqual(1); // pega o #FF0000 e 10px
  });

  it('deve falhar para BP-012 (emoji)', () => {
    fs.writeFileSync(path.join(tmpDir, 'site', 'src/app.ts'), 'console.log("🚀");');
    const result = verificarBlueprint(tmpDir);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('BP-012'))).toBe(true);
  });

  it('deve falhar para BP-013 (contraponto)', () => {
    fs.writeFileSync(path.join(tmpDir, 'site', 'src/app.ts'), 'const texto = "Este é um Contraponto";');
    const result = verificarBlueprint(tmpDir);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('BP-013'))).toBe(true);
  });
});
