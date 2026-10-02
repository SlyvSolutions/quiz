import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'node:fs';
import { gerarTokens } from '../../scripts/gerar-tokens';

vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>();
  return {
    ...actual,
    writeFileSync: vi.fn(),
    existsSync: vi.fn().mockReturnValue(true),
    mkdirSync: vi.fn()
  };
});

describe('gerar-tokens', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve gerar variáveis CSS para todos os tokens', () => {
    gerarTokens();

    expect(fs.writeFileSync).toHaveBeenCalledTimes(2);

    const tokensCall = vi.mocked(fs.writeFileSync).mock.calls.find(call => call[0].toString().includes('tokens.css'));
    const temasCall = vi.mocked(fs.writeFileSync).mock.calls.find(call => call[0].toString().includes('temas.css'));

    expect(tokensCall).toBeDefined();
    expect(temasCall).toBeDefined();

    const tokensCss = tokensCall![1] as string;
    const temasCss = temasCall![1] as string;

    // Checa alguns tokens essenciais para garantir que não falta
    expect(tokensCss).toContain('--mq-font-sans: "Helvetica Neue", Helvetica, Arial, sans-serif;');
    expect(tokensCss).toContain('--mq-space-2: 8px;');
    expect(tokensCss).toContain('--mq-radius-md: 8px;');
    expect(tokensCss).toContain('--mq-shadow-card: 0 1px 0 rgba(0,0,0,0.04);');

    // Checa cores (temas)
    expect(temasCss).toContain(':root, [data-tema="claro"]');
    expect(temasCss).toContain('[data-tema="escuro"]');
    expect(temasCss).toContain('--mq-amarelo: #FCBE26;'); // Resolvido direto
    expect(temasCss).toContain('--mq-ink: var(--mq-tinta);'); // Resolvido {tinta}
  });

  it('rodar o script duas vezes gera arquivo idêntico', () => {
    gerarTokens();
    const call1Tokens = vi.mocked(fs.writeFileSync).mock.calls.find(call => call[0].toString().includes('tokens.css'))![1];
    
    vi.clearAllMocks();
    
    gerarTokens();
    const call2Tokens = vi.mocked(fs.writeFileSync).mock.calls.find(call => call[0].toString().includes('tokens.css'))![1];

    expect(call1Tokens).toBe(call2Tokens);
  });
});
