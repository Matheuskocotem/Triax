/**
 * lib/triangulation/detector.ts — detecção de oportunidade (TRIAX-13).
 *
 * Fase TDD: RED. O stub lança "Not implemented" → todos devem FALHAR.
 * Cobre o cálculo do produto do ciclo e o efeito das taxas (0,1% por operação).
 */
import { detectOpportunity } from '../src/lib/triangulation/detector';

describe('detectOpportunity — detecção de triangulação (TRIAX-13)', () => {
  // Critério: calcula o produto do ciclo (antes das taxas).
  it('calcula o produto do ciclo dos 3 pares', () => {
    const result = detectOpportunity({ ab: 1, bc: 1, ca: 1.05 });
    expect(result.product).toBeCloseTo(1.05, 6);
  });

  // Critério: produto > 1 após as taxas → oportunidade, com lucro estimado em %.
  it('acusa oportunidade quando o produto supera 1 após as taxas', () => {
    const result = detectOpportunity({ ab: 1, bc: 1, ca: 1.05 });
    expect(result.hasOpportunity).toBe(true);
    // 1.05 * 0.999^3 - 1 ≈ 4.685%
    expect(result.profitPct).toBeGreaterThan(0);
    expect(result.profitPct).toBeCloseTo(4.685, 2);
  });

  // Critério: produto <= 1 → sem oportunidade, lucro 0.
  it('não acusa oportunidade quando o produto é <= 1', () => {
    const result = detectOpportunity({ ab: 1, bc: 1, ca: 1.0 });
    expect(result.hasOpportunity).toBe(false);
    expect(result.profitPct).toBe(0);
  });

  // Critério: as taxas derrubam um produto que era > 1 mas pequeno demais.
  it('considera as taxas: produto pouco acima de 1 vira sem oportunidade', () => {
    // 1.002 * 0.999^3 ≈ 0.999 < 1
    const result = detectOpportunity({ ab: 1, bc: 1, ca: 1.002 });
    expect(result.hasOpportunity).toBe(false);
  });

  // Critério: retorna o lucro estimado em % numa oportunidade clara.
  it('retorna o lucro estimado em % numa oportunidade clara', () => {
    // produto = 2 * 0.5 * 1.1 = 1.1 ; após taxas ≈ 9,67%
    const result = detectOpportunity({ ab: 2, bc: 0.5, ca: 1.1 });
    expect(result.hasOpportunity).toBe(true);
    expect(result.profitPct).toBeCloseTo(9.67, 1);
  });
});
