import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import { ManifestoIntegridadeSchema } from '../../src/data/tipos';
import { listarArquivos, verificarManifesto, type ManifestoFull } from '../../scripts/gerar-manifesto';

const publicDir = join(import.meta.dirname, '../../public');
const manifestoPath = join(publicDir, 'manifesto.json');

const ManifestoSchema = z.object({
  gerado_em: z.string().refine(v => !Number.isNaN(Date.parse(v))),
  arquivos: z.array(ManifestoIntegridadeSchema),
});

describe('manifesto.json publicado (BP-008)', () => {
  it('existe em public/', () => {
    expect(existsSync(manifestoPath)).toBe(true);
  });

  it('tem o formato lido por ManifestoIntegridadeSchema, com SHA-256 hexadecimal', () => {
    const manifesto = ManifestoSchema.parse(JSON.parse(readFileSync(manifestoPath, 'utf-8')));
    for (const item of manifesto.arquivos) {
      expect(item.sha256).toMatch(/^[0-9a-f]{64}$/);
    }
  });

  it('lista exatamente os arquivos de public/, sem o próprio manifesto', () => {
    const manifesto: ManifestoFull = JSON.parse(readFileSync(manifestoPath, 'utf-8'));
    const listados = manifesto.arquivos.map(a => a.arquivo).sort();
    expect(listados).not.toContain('manifesto.json');
    expect(listados).toEqual(listarArquivos(publicDir).sort());
  });

  it('bate com os hashes reais (rode "npm run manifesto" se mudou algo em public/)', () => {
    const manifesto: ManifestoFull = JSON.parse(readFileSync(manifestoPath, 'utf-8'));
    expect(verificarManifesto(publicDir, manifesto)).toEqual([]);
  });
});
