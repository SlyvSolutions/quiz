/** Gera a imagem PNG de um elemento. Devolve null se a geração falhar. */
export async function gerarBlobDeElemento(element: HTMLElement): Promise<Blob | null> {
  try {
    // Importação dinâmica para não pesar o bundle inicial
    const html2canvas = (await import('html2canvas')).default;
    const canvas = await html2canvas(element, {
      scale: 2, // Maior resolução
      useCORS: true,
      backgroundColor: getComputedStyle(element).getPropertyValue('--mq-preto').trim() || null,
    });
    return await new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'));
  } catch (err) {
    console.error('Falha ao gerar imagem com html2canvas', err);
    return null;
  }
}
