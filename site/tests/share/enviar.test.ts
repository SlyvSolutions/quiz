// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { NOME_ARQUIVO, baixarImagem, compartilharImagem, podeCompartilharArquivo } from '../../src/share/enviar';

const blob = new Blob(['x'], { type: 'image/png' });
const dados = { blob, nomeArquivo: NOME_ARQUIVO, texto: 'Meu resultado https://exemplo.test' };
const nav = (parcial: Record<string, unknown>) => parcial as unknown as Navigator;

describe('podeCompartilharArquivo', () => {
  it('é falso sem navigator.share', () => {
    expect(podeCompartilharArquivo(nav({}))).toBe(false);
  });

  it('é falso quando o navegador não compartilha arquivos', () => {
    expect(podeCompartilharArquivo(nav({ share: vi.fn(), canShare: () => false }))).toBe(false);
  });

  it('é verdadeiro quando share e canShare aceitam arquivo de imagem', () => {
    const canShare = vi.fn((_d: unknown) => true);
    expect(podeCompartilharArquivo(nav({ share: vi.fn(), canShare }))).toBe(true);
    const arg = canShare.mock.calls[0]![0] as { files: File[] };
    expect(arg.files[0]!.type).toBe('image/png');
  });

  it('é falso se canShare lança erro', () => {
    expect(podeCompartilharArquivo(nav({ share: vi.fn(), canShare: () => { throw new Error('x'); } }))).toBe(false);
  });
});

describe('compartilharImagem', () => {
  it('chama share com o arquivo PNG e o texto', async () => {
    const share = vi.fn(async () => undefined);
    const r = await compartilharImagem(dados, nav({ share }));
    expect(r).toBe('compartilhado');
    const arg = (share.mock.calls[0] as unknown[])[0] as { files: File[]; text: string };
    expect(arg.files[0]!.name).toBe(NOME_ARQUIVO);
    expect(arg.files[0]!.type).toBe('image/png');
    expect(arg.text).toBe(dados.texto);
  });

  it('devolve "cancelado" quando a pessoa fecha a folha (AbortError)', async () => {
    const share = vi.fn(async () => {
      throw Object.assign(new Error('cancelado'), { name: 'AbortError' });
    });
    expect(await compartilharImagem(dados, nav({ share }))).toBe('cancelado');
  });

  it('propaga outros erros', async () => {
    const share = vi.fn(async () => {
      throw Object.assign(new Error('negado'), { name: 'NotAllowedError' });
    });
    await expect(compartilharImagem(dados, nav({ share }))).rejects.toThrow('negado');
  });
});

describe('baixarImagem', () => {
  it('cria um link de download com o nome do arquivo e o remove em seguida', () => {
    const criar = vi.fn(() => 'blob:teste');
    const revogar = vi.fn();
    vi.stubGlobal('URL', { ...URL, createObjectURL: criar, revokeObjectURL: revogar });
    const clique = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    baixarImagem(blob, NOME_ARQUIVO);
    expect(criar).toHaveBeenCalledWith(blob);
    expect(clique).toHaveBeenCalledTimes(1);
    expect(document.querySelector('a[download]')).toBeNull();
    clique.mockRestore();
    vi.unstubAllGlobals();
  });
});
