/**
 * StrategyForm — teste visual/design (Tailwind). Dia de design.
 * Fase RED: sem classes → FALHA. Exige campos estilizados + botão salvar roxo.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';

const ADDR = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
jest.mock('wagmi', () => ({ useAccount: () => ({ address: ADDR, isConnected: true }) }));
jest.mock('@/lib/contract/managerContract', () => ({ fetchManagerData: jest.fn() }));
jest.mock('@/lib/contract/deposit', () => ({ saveStrategy: jest.fn() }));
import { fetchManagerData } from '@/lib/contract/managerContract';
import { StrategyForm } from '@/components/dashboard/StrategyForm';

const mockManager = fetchManagerData as jest.Mock;

describe('StrategyForm — visual/design (Tailwind)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockManager.mockResolvedValue({
      address: ADDR, name: 'Mesa Alpha', strategy: 'Tri', apy: 0, status: 'active',
    });
  });

  it('tem campos estilizados e botão salvar roxo', async () => {
    const { container } = render(<StrategyForm />);
    const pairs = await screen.findByLabelText(/pares/i);

    expect(pairs.className).toMatch(/bg-gray-900/);
    expect(pairs.className).toMatch(/border-gray-700/);

    const btn = screen.getByRole('button', { name: /salvar estrat/i });
    expect(btn.className).toMatch(/violet/);

    expect((container.firstChild as HTMLElement).className).toMatch(/rounded-xl/);
  });
});
