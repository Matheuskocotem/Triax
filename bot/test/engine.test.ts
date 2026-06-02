/**
 * lib/triangulation/engine.ts — loop principal (TRIAX-13).
 *
 * Fase TDD: RED. O stub lança "Not implemented" → todos devem FALHAR.
 * Todos os colaboradores (contrato, Redis, executor, shutdown) são mocks
 * injetados via EngineDeps.
 */
import { runEngine, EngineDeps } from '../src/lib/triangulation/engine';

const STRATEGY = { pairs: ['BTC/ETH', 'ETH/USDT', 'USDT/BTC'], commissionBps: 1000 };

// Para o loop após `iterations` voltas (shouldStop vira true depois disso).
function stopAfter(iterations: number): () => boolean {
  let n = 0;
  return () => n++ >= iterations;
}

function makeDeps(overrides: Partial<EngineDeps> = {}): EngineDeps {
  return {
    readStrategy: jest.fn().mockResolvedValue(STRATEGY),
    fetchPrices: jest.fn().mockResolvedValue({ ab: 1, bc: 1, ca: 1.05 }), // com oportunidade
    executeCycle: jest.fn().mockResolvedValue(true),
    shouldStop: stopAfter(1),
    onError: jest.fn(),
    ...overrides,
  };
}

describe('runEngine — loop de triangulação (TRIAX-13)', () => {
  // Critério: lê estratégia, busca preços e, havendo oportunidade, executa o ciclo.
  it('lê estratégia, busca preços e executa quando há oportunidade', async () => {
    const deps = makeDeps();

    await runEngine(deps);

    expect(deps.readStrategy).toHaveBeenCalled();
    expect(deps.fetchPrices).toHaveBeenCalled();
    expect(deps.executeCycle).toHaveBeenCalledTimes(1);
  });

  // Critério: sem oportunidade → não executa o ciclo.
  it('não executa o ciclo quando não há oportunidade', async () => {
    const deps = makeDeps({
      fetchPrices: jest.fn().mockResolvedValue({ ab: 1, bc: 1, ca: 1.0 }), // sem oportunidade
    });

    await runEngine(deps);

    expect(deps.executeCycle).not.toHaveBeenCalled();
  });

  // Critério: resiliência — um ciclo que falha não derruba o loop; ele continua.
  it('continua o loop mesmo quando um ciclo falha', async () => {
    const executeCycle = jest
      .fn()
      .mockRejectedValueOnce(new Error('ciclo falhou'))
      .mockResolvedValue(true);
    const deps = makeDeps({ executeCycle, shouldStop: stopAfter(2) });

    await expect(runEngine(deps)).resolves.toBeUndefined();
    expect(executeCycle).toHaveBeenCalledTimes(2);
  });

  // Critério: para limpo ao receber sinal de shutdown (não trava, não executa).
  it('para limpo quando recebe o sinal de shutdown', async () => {
    const deps = makeDeps({ shouldStop: () => true });

    await expect(runEngine(deps)).resolves.toBeUndefined();
    expect(deps.executeCycle).not.toHaveBeenCalled();
  });
});
