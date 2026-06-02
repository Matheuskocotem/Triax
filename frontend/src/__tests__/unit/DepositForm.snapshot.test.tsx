/**
 * DepositForm — teste visual/design (Tailwind). Dia de design.
 * Fase RED: sem classes → FALHA. Exige input estilizado + botão primário roxo.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('wagmi', () => ({ useAccount: () => ({ isConnected: true }) }));
jest.mock('@/lib/contract/deposit', () => ({ approveToken: jest.fn(), depositFunds: jest.fn() }));
jest.mock('@/hooks/useManagerAddress', () => ({
  useManagerAddress: () => '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
}));
import { DepositForm } from '@/components/deposit/DepositForm';

describe('DepositForm — visual/design (Tailwind)', () => {
  it('tem input estilizado (fundo/borda) e botão primário roxo', () => {
    render(<DepositForm />);

    const input = screen.getByLabelText(/valor do dep[óo]sito/i);
    expect(input.className).toMatch(/bg-gray-900/);
    expect(input.className).toMatch(/border-gray-700/);

    const btn = screen.getByRole('button', { name: /depositar/i });
    expect(btn.className).toMatch(/violet/);
  });
});
