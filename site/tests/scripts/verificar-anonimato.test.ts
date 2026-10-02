import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as childProcess from 'node:child_process';
import { verificarAnonimato } from '../../scripts/verificar-anonimato';

vi.mock('node:child_process');

describe('verificar-anonimato', () => {
  let exitSpy: any;
  let errorSpy: any;
  let logSpy: any;

  beforeEach(() => {
    exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('deve passar quando nenhum nome for encontrado', () => {
    vi.mocked(childProcess.execSync).mockReturnValue('');
    verificarAnonimato();
    expect(exitSpy).toHaveBeenCalledWith(0);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Nenhum nome pessoal'));
  });

  it('deve falhar quando nomes forem encontrados', () => {
    vi.mocked(childProcess.execSync).mockReturnValue('docs/arquivo.md:3:um nome pessoal qualquer');
    verificarAnonimato();
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Foram encontrados nomes pessoais'));
  });

  it('falha quando o git grep sai com erro diferente de 1', () => {
    vi.mocked(childProcess.execSync).mockImplementation(() => {
      throw Object.assign(new Error('fatal'), { status: 128 });
    });
    verificarAnonimato();
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Erro ao executar git grep'), expect.anything());
  });

  it('passa quando o git grep sai com 1 (nenhuma ocorrência)', () => {
    vi.mocked(childProcess.execSync).mockImplementation(() => {
      throw Object.assign(new Error('sem resultado'), { status: 1 });
    });
    verificarAnonimato();
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  it('exclui .sled da busca e usa palavra inteira para o nome solto', () => {
    vi.mocked(childProcess.execSync).mockReturnValue('');
    verificarAnonimato();
    const comando = String(vi.mocked(childProcess.execSync).mock.calls[0]![0]);
    expect(comando).toContain(':(top,exclude).sled');
    expect(comando).toContain('[^[:alnum:]+/]');
  });
});
