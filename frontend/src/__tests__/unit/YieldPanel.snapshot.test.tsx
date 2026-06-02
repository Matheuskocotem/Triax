/**
 * YieldPanel — teste visual/design (Tailwind). Dia de design.
 * Fase RED: sem classes → FALHA. Exige cards de métrica e variação positiva verde.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';

const ADDR = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
jest.mock('wagmi', () => ({ useAccount: () => ({ address: ADDR, isConnected: true }) }));
jest.mock('@/lib/contract/managerContract', () => ({ fetchPortfolio: jest.fn() }));
jest.mock('@/lib/api/operations', () => ({ fetchOperations: jest.fn() }));
jest.mock('@/lib/auth/session', () => ({ getSession: jest.fn(() => null) }));
import { fetchPortfolio } from '@/lib/contract/managerContract';
import { fetchOperations } from '@/lib/api/operations';
import { YieldPanel } from '@/components/dashboard/YieldPanel';

const mockPortfolio = fetchPortfolio as jest.Mock;
const mockOps = fetchOperations as jest.Mock;

describe('YieldPanel — visual/design (Tailwind)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // saldo 100 + rendimento 5 → variação +5% (positiva → verde)
    mockPortfolio.mockResolvedValue({ balance: '100', yield: '5', status: 'active', positions: [] });
    mockOps.mockResolvedValue([{ id: 1, date: '2026-05-30', pair: 'BTC/ETH', result: '+1.2%' }]);
  });

  it('mostra cards de métrica e a variação positiva em verde', async () => {
    const { container } = render(<YieldPanel pollIntervalMs={999999} />);
    await screen.findByText(/rendimento acumulado/i);

    // cards de métrica arredondados
    expect(container.querySelector('.rounded-xl')).not.toBeNull();
    // variação positiva em verde
    expect(container.querySelector('.text-green-400')).not.toBeNull();
  });
});
