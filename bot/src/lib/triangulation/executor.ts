// Executor do ciclo de triangulação (TRIAX-13).
// Fase TDD: RED — stub. Implementação mínima virá na fase GREEN.

/** Exchange estilo ccxt (apenas o necessário para o ciclo). */
export interface OrderExchange {
  createOrder(symbol: string, type: string, side: string, amount: number): Promise<unknown>;
}

/** Persistência das operações (estilo pg.Pool). */
export interface OperationStore {
  query(sql: string, params?: unknown[]): Promise<unknown>;
}

export interface CyclePlan {
  /** 3 símbolos do ciclo, ex.: ['BTC/ETH','ETH/USDT','USDT/BTC']. */
  pairs: string[];
  /** Tamanho da ordem inicial. */
  amount: number;
  /** Lucro estimado em % (do detector). */
  profitPct: number;
  /** Endereço (gestor/investidor) para registrar a operação. */
  address: string;
}

// Executa as 3 ordens em sequência; registra no Postgres no sucesso; retorna
// false (sem lançar) se qualquer ordem falhar.
export async function executeCycle(
  plan: CyclePlan,
  exchange: OrderExchange,
  store: OperationStore,
): Promise<boolean> {
  try {
    // 3 ordens a mercado, na ordem do ciclo.
    for (const symbol of plan.pairs) {
      await exchange.createOrder(symbol, 'market', 'buy', plan.amount);
    }

    // Só registra após o ciclo completo.
    await store.query(
      'INSERT INTO operations (address, pairs, profit_pct, created_at) VALUES ($1, $2, $3, NOW())',
      [plan.address, plan.pairs.join(','), plan.profitPct],
    );

    return true;
  } catch (err) {
    console.error('[triangulation] ciclo falhou:', err);
    return false;
  }
}
