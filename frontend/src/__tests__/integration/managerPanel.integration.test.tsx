/**
 * components/dashboard/ManagerPanel.tsx — painel do gestor (TRIAX-10).
 *
 * Fase TDD: RED. O stub lança "Not implemented" → todos devem FALHAR.
 * Mocka o agregado do gestor (fetchManagerStats) e a borda de wallet (wagmi).
 */
import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('@/lib/contract/managerContract', () => ({
  fetchManagerStats: jest.fn(),
}));
import { fetchManagerStats } from '@/lib/contract/managerContract';

let mockAccount: { address?: string; isConnected: boolean } = {
  address: '0x1234567890abcdef1234567890abcdef12345678',
  isConnected: true,
};
jest.mock('wagmi', () => ({ useAccount: () => mockAccount }));

import { ManagerPanel } from '@/components/dashboard/ManagerPanel';

const statsMock = fetchManagerStats as jest.Mock;

describe('ManagerPanel — agregado do gestor (TRIAX-10)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAccount = { address: '0x1234567890abcdef1234567890abcdef12345678', isConnected: true };
    statsMock.mockResolvedValue({ totalDeposited: '150', investorCount: 2, commissionAccrued: '5' });
  });

  it('renderiza o painel quando o endereço conectado é um gestor', async () => {
    render(<ManagerPanel />);
    expect(await screen.findByText(/total sob gestão/i)).toBeInTheDocument();
  });

  it('exibe o total sob gestão formatado', async () => {
    render(<ManagerPanel />);
    expect(await screen.findByText(/total sob gestão:\s*150/i)).toBeInTheDocument();
  });

  it('exibe o número de investidores', async () => {
    render(<ManagerPanel />);
    expect(await screen.findByText(/investidores:\s*2/i)).toBeInTheDocument();
  });

  it('exibe a comissão acumulada', async () => {
    render(<ManagerPanel />);
    expect(await screen.findByText(/comiss[ãa]o.*:\s*5/i)).toBeInTheDocument();
  });

  it('exibe "Você não é um gestor registrado" quando não é gestor', async () => {
    statsMock.mockRejectedValue(new Error('manager not found'));
    render(<ManagerPanel />);
    expect(await screen.findByText(/não é um gestor registrado/i)).toBeInTheDocument();
  });

  it('exibe loading enquanto carrega', () => {
    statsMock.mockReturnValue(new Promise(() => {}));
    render(<ManagerPanel />);
    expect(screen.getByText(/carregando|loading/i)).toBeInTheDocument();
  });
});
