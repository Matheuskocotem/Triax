// Loop principal do engine de triangulação (TRIAX-13).
// Fase TDD: RED — stub. Implementação mínima virá na fase GREEN.

import { detectOpportunity } from './detector';
import type { TrianglePrices } from './detector';
import type { CyclePlan } from './executor';

/** Estratégia do gestor lida no contrato. */
export interface StrategyConfig {
  /** Endereço do gestor cuja estratégia está sendo executada. */
  manager: string;
  pairs: string[];
  commissionBps: number;
}

/** Tamanho da ordem inicial do ciclo (default; a fiação real pode sobrescrever). */
const DEFAULT_AMOUNT = 1;

/**
 * Colaboradores injetados (mockados nos testes): leitura da estratégia no
 * contrato, preços no cache Redis, execução do ciclo, sinal de shutdown e
 * tratamento de erro (resiliência).
 */
export interface EngineDeps {
  readStrategy(): Promise<StrategyConfig>;
  fetchPrices(pairs: string[]): Promise<TrianglePrices>;
  executeCycle(plan: CyclePlan): Promise<boolean>;
  /** Verdadeiro quando o loop deve parar (sinal de shutdown). */
  shouldStop(): boolean;
  onError?(err: unknown): void;
}

// Roda o loop: lê estratégia → busca preços → detecta → executa se houver
// oportunidade. Continua após falhas; para limpo quando shouldStop() vira true.
export async function runEngine(deps: EngineDeps): Promise<void> {
  while (!deps.shouldStop()) {
    try {
      const strategy = await deps.readStrategy();
      const prices = await deps.fetchPrices(strategy.pairs);
      const opp = detectOpportunity(prices);

      if (opp.hasOpportunity) {
        const plan: CyclePlan = {
          pairs: strategy.pairs,
          amount: DEFAULT_AMOUNT,
          profitPct: opp.profitPct,
          address: strategy.manager,
        };
        await deps.executeCycle(plan);
      }
    } catch (err) {
      // Resiliência: um ciclo que falha não derruba o loop.
      deps.onError?.(err);
    }
  }
}
