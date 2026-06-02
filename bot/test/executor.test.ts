/**
 * lib/triangulation/executor.ts — execução do ciclo (TRIAX-13).
 *
 * Fase TDD: RED. O stub lança "Not implemented" → todos devem FALHAR.
 * ccxt e pg entram como dublês (mocks) injetados — sem rede nem banco real.
 */
import { executeCycle, CyclePlan, OrderExchange, OperationStore } from '../src/lib/triangulation/executor';

const PLAN: CyclePlan = {
  pairs: ['BTC/ETH', 'ETH/USDT', 'USDT/BTC'],
  amount: 1,
  profitPct: 4.6,
  address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
};

function makeExchange(): jest.Mocked<OrderExchange> {
  return { createOrder: jest.fn().mockResolvedValue({ id: 'order-1' }) };
}
function makeStore(): jest.Mocked<OperationStore> {
  return { query: jest.fn().mockResolvedValue({ rows: [] }) };
}

describe('executeCycle — execução do ciclo (TRIAX-13)', () => {
  // Critério: executa as 3 ordens em sequência e retorna true no ciclo completo.
  it('executa 3 ordens em sequência e retorna true', async () => {
    const exchange = makeExchange();
    const store = makeStore();

    const ok = await executeCycle(PLAN, exchange, store);

    expect(exchange.createOrder).toHaveBeenCalledTimes(3);
    expect(ok).toBe(true);
  });

  // Critério: registra a operação no Postgres após o sucesso.
  it('registra a operação no Postgres após o sucesso', async () => {
    const exchange = makeExchange();
    const store = makeStore();

    await executeCycle(PLAN, exchange, store);

    expect(store.query).toHaveBeenCalledTimes(1);
    expect(String(store.query.mock.calls[0][0])).toMatch(/insert/i);
  });

  // Critério: se qualquer ordem falha, loga e retorna false (não lança) e não registra.
  it('retorna false (sem lançar) quando uma ordem falha', async () => {
    const exchange = makeExchange();
    exchange.createOrder
      .mockResolvedValueOnce({ id: 'order-1' })
      .mockRejectedValueOnce(new Error('exchange down'));
    const store = makeStore();
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const ok = await executeCycle(PLAN, exchange, store);

    expect(ok).toBe(false);
    expect(store.query).not.toHaveBeenCalled();
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });
});
