import { describe, it, expect, vi, afterEach } from 'vitest';
import { carregarJSON, ErroCargaDados } from '../../src/data/carregar';
import { z } from 'zod';

const TestSchema = z.object({
  id: z.string(),
  valor: z.number()
});

describe('carregarJSON', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('carrega e valida JSON corretamente', async () => {
    const mockData = { id: '123', valor: 42 };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData)
    });

    const resultado = await carregarJSON('http://fake.url', TestSchema);
    expect(resultado).toEqual(mockData);
  });

  it('falha de rede devolve erro para tentar de novo', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network Error'));

    await expect(carregarJSON('http://fake.url', TestSchema))
      .rejects.toThrowError(ErroCargaDados);
      
    await expect(carregarJSON('http://fake.url', TestSchema))
      .rejects.toThrowError('Falha de rede');
  });

  it('recusa JSON fora da forma esperada (schema mismatch)', async () => {
    const mockData = { id: '123', valor: 'nao_eh_numero' }; // valor devia ser number
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData)
    });

    await expect(carregarJSON('http://fake.url', TestSchema))
      .rejects.toThrowError('Formato de dados inválido');
  });

  it('rejeita JSON malformado (parse error)', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.reject(new SyntaxError('Unexpected token'))
    });

    await expect(carregarJSON('http://fake.url', TestSchema))
      .rejects.toThrowError('JSON inválido');
  });

  it('rejeita resposta não ok (ex: 404)', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found'
    });

    await expect(carregarJSON('http://fake.url', TestSchema))
      .rejects.toThrowError('HTTP 404 Not Found');
  });
});
