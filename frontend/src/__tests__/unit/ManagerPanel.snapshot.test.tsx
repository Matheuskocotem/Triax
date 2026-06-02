/**
 * ManagerPanel — teste visual/design (Tailwind). Dia de design.
 * Fase RED: sem classes → FALHA. Exige métricas em cards com accent roxo.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';

const ADDR = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
jest.mock('wagmi', () => ({ useAccount: () => ({ address: ADDR, isConnected: true }) }));
jest.mock('@/lib/contract/managerContract', () => ({ fetchManagerStats: jest.fn() }));
import { fetchManagerStats } from '@/lib/contract/managerContract';
import { ManagerPanel } from '@/components/dashboard/ManagerPanel';

const mockStats = fetchManagerStats as jest.Mock;

describe('ManagerPanel — visual/design (Tailwind)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStats.mockResolvedValue({ totalDeposited: '150', investorCount: 2, commissionAccrued: '1.5' });
  });

  it('mostra as métricas em cards com accent roxo', async () => {
    const { container } = render(<ManagerPanel />);
    await screen.findByText(/total sob gest[ãa]o/i);

    expect(container.querySelector('.rounded-xl')).not.toBeNull();
    expect(container.querySelector('.text-violet-400')).not.toBeNull();
  });
});
