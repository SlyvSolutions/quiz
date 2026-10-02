/** Nome do arquivo da imagem compartilhada ou baixada. */
export const NOME_ARQUIVO = 'meu-resultado.png';

export interface DadosEnvio {
  blob: Blob;
  nomeArquivo: string;
  texto: string;
}

/** True se o navegador consegue abrir a folha de compartilhamento com um arquivo de imagem (celulares e alguns desktops). */
export function podeCompartilharArquivo(nav: Navigator = navigator): boolean {
  if (typeof nav.share !== 'function' || typeof nav.canShare !== 'function') return false;
  try {
    return nav.canShare({ files: [new File([''], 'a.png', { type: 'image/png' })] });
  } catch {
    return false;
  }
}

/** Abre a folha de compartilhamento do aparelho com a imagem e o texto. "cancelado" quando a pessoa fecha a folha. */
export async function compartilharImagem(dados: DadosEnvio, nav: Navigator = navigator): Promise<'compartilhado' | 'cancelado'> {
  const arquivo = new File([dados.blob], dados.nomeArquivo, { type: 'image/png' });
  try {
    await nav.share({ files: [arquivo], text: dados.texto });
    return 'compartilhado';
  } catch (e) {
    if ((e as { name?: string }).name === 'AbortError') return 'cancelado';
    throw e;
  }
}

/** Baixa a imagem como arquivo. */
export function baixarImagem(blob: Blob, nomeArquivo: string, doc: Document = document): void {
  const url = URL.createObjectURL(blob);
  const a = doc.createElement('a');
  a.href = url;
  a.download = nomeArquivo;
  doc.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
