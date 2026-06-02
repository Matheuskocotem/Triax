/**
 * WithdrawForm — teste visual/design (Tailwind). Dia de design.
 * Fase RED: sem classes → FALHA. Exige input estilizado + botão primário roxo.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';

const ADDR = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
jest.mock('wagmi', () => ({ useAccount: () => ({ address: ADDR, isConnected: true }) }));
jest.mock('@/lib/contract/managerContract', () => ({ fetchPortfolio: jest.fn() }));
jest.mock('@/lib/contract/deposit', () => ({ withdrawFunds: jest.fn() }));
import { fetchPortfolio } from '@/lib/contract/managerContract';
import { WithdrawForm } from '@/components/dashboard/WithdrawForm';

const mockPortfolio = fetchPortfolio as jest.Mock;

describe('WithdrawForm — visual/design (Tailwind)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPortfolio.mockResolvedValue({ balance: '100', yield: '0', status: 'active', positions: [] });
  });

  it('tem input estilizado (fundo/borda) e botão primário roxo', async () => {
    render(<WithdrawForm />);
    await screen.findByText(/saldo dispon[ií]vel/i);

    const input = screen.getByLabelText(/valor do saque/i);
    expect(input.className).toMatch(/bg-gray-900/);
    expect(input.className).toMatch(/border-gray-700/);

    const btn = screen.getByRole('button', { name: /sacar/i });
    expect(btn.className).toMatch(/violet/);
  });
});
