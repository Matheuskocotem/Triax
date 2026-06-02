// Detector de oportunidade de triangulação (TRIAX-13).
// Fase TDD: RED — stub. Implementação mínima virá na fase GREEN.

/** Taxas de conversão do ciclo A→B→C→A (quanto se recebe por unidade). */
export interface TrianglePrices {
  ab: number; // A→B
  bc: number; // B→C
  ca: number; // C→A
}

export interface Opportunity {
  /** Há lucro após as taxas? */
  hasOpportunity: boolean;
  /** Lucro estimado em % (0 quando não há oportunidade). */
  profitPct: number;
  /** Produto bruto do ciclo (antes das taxas). */
  product: number;
}

/** Taxa padrão por operação: 0,1%. */
export const DEFAULT_FEE_RATE = 0.001;

// Detecta oportunidade: produto do ciclo, descontadas as 3 taxas, precisa ficar
// > 1. effective = ab * bc * ca * (1 - fee)^3.
export function detectOpportunity(prices: TrianglePrices, feeRate = DEFAULT_FEE_RATE): Opportunity {
  const product = prices.ab * prices.bc * prices.ca;
  const effective = product * Math.pow(1 - feeRate, 3);

  if (effective > 1) {
    return { hasOpportunity: true, profitPct: (effective - 1) * 100, product };
  }
  return { hasOpportunity: false, profitPct: 0, product };
}
