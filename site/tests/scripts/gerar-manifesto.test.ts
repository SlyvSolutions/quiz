import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
// import * as path from 'node:path';
import { gerarManifesto, verificarManifesto } from '../../scripts/gerar-manifesto';

vi.mock('node:fs');

describe('gerar-manifesto', () => {
  beforeEach(() => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readdirSync).mockImplementation((dir: string | Buffer | URL) => {
      const d = dir.toString();
      if (d.includes('public')) {
        return ['arquivo1.txt', 'arquivo2.png', 'manifesto.json'] as any;
      }
      return [];
    });
    vi.mocked(fs.statSync).mockImplementation((() => ({
      isDirectory: () => false
    })) as any);
    vi.mocked(fs.readFileSync).mockImplementation((p: string | Buffer | URL | number) => {
      return Buffer.from('conteudo mock ' + p.toString());
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('deve gerar manifesto ignorando o proprio arquivo manifesto.json', () => {
    const manifesto = gerarManifesto('/fake/public');
    expect(manifesto.arquivos).toHaveLength(2);
    expect(manifesto.arquivos.find(a => a.arquivo === 'manifesto.json')).toBeUndefined();
    expect(manifesto.arquivos[0]!.sha256).toHaveLength(64); // SHA-256 length is 64 hex chars
    expect(manifesto.gerado_em).toBeDefined();
  });

  it('deve retornar vazio quando manifesto e valido', () => {
    const manifesto = gerarManifesto('/fake/public');
    const erros = verificarManifesto('/fake/public', manifesto);
    expect(erros).toHaveLength(0);
  });

  it('deve falhar com ARQUIVO_NAO_LISTADO se public tem arquivo a mais', () => {
    const manifesto = gerarManifesto('/fake/public');
    // Simulando que agora public tem mais arquivos
    vi.mocked(fs.readdirSync).mockImplementation(() => {
      return ['arquivo1.txt', 'arquivo2.png', 'arquivo-novo.txt', 'manifesto.json'] as any;
    });

    const erros = verificarManifesto('/fake/public', manifesto);
    expect(erros).toHaveLength(1);
    expect(erros[0]).toContain('ARQUIVO_NAO_LISTADO');
    expect(erros[0]).toContain('arquivo-novo.txt');
  });

  it('deve falhar com HASH_INVALIDO se o arquivo mudou um byte', () => {
    const manifesto = gerarManifesto('/fake/public');
    
    // Simulando arquivo modificado
    vi.mocked(fs.readFileSync).mockImplementation((p: string | Buffer | URL | number) => {
      if (p.toString().includes('arquivo1.txt')) {
        return Buffer.from('conteudo MODIFICADO');
      }
      return Buffer.from('conteudo mock ' + p.toString());
    });

    const erros = verificarManifesto('/fake/public', manifesto);
    expect(erros).toHaveLength(1);
    expect(erros[0]).toContain('HASH_INVALIDO');
    expect(erros[0]).toContain('arquivo1.txt');
  });
});
