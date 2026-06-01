/**
 * components/dashboard/YieldPanel.tsx — acompanhar rendimentos (TRIAX-9).
 *
 * Fase TDD: RED. O stub lança "Not implemented" → todos devem FALHAR.
 * Mocka a leitura do contrato (fetchPortfolio), o histórico (fetchOperations)
 * e a borda de wallet (wagmi useAccount). Não toca a rede.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('@/lib/contract/managerContract', () => ({
  fetchPortfolio: jest.fn(),
}));
jest.mock('@/lib/api/operations', () => ({
  fetchOperations: jest.fn(),
}));
import { fetchPortfolio } from '@/lib/contract/managerContract';
import { fetchOperations } from '@/lib/api/operations';

let mockAccount: { address?: string; isConnected: boolean } = {
  address: '0x1234567890abcdef1234567890abcdef12345678',
  isConnected: true,
};
jest.mock('wagmi', () => ({ useAccount: () => mockAccount }));

import { YieldPanel } from '@/components/dashboard/YieldPanel';

const portfolioMock = fetchPortfolio as jest.Mock;
const opsMock = fetchOperations as jest.Mock;

const OPERATION = { id: 1, date: '2026-05-30', pair: 'BTC/ETH', result: '+1.2%' };

describe('YieldPanel — acompanhar rendimentos (TRIAX-9)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAccount = { address: '0x1234567890abcdef1234567890abcdef12345678', isConnected: true };
    // balance 1000 / yield 50 → variação 5%.
    portfolioMock.mockResolvedValue({ balance: '1000', yield: '50', status: 'active', positions: [] });
    opsMock.mockResolvedValue([]);
  });

  it('exibe o rendimento acumulado', async () => {
    expect(render(<YieldPanel />)).toBeTruthy();
    expect(await screen.findByText(/rendimento acumulado:\s*50/i)).toBeInTheDocument();
  });

  it('exibe a variação percentual (yield/balance * 100)', async () => {
    render(<YieldPanel />);
    expect(await screen.findByText(/5(\.\d+)?\s*%/)).toBeInTheDocument();
  });

  it('exibe "Sem operações" quando o histórico está vazio', async () => {
    opsMock.mockResolvedValue([]);
    render(<YieldPanel />);
    expect(await screen.findByText(/sem operações/i)).toBeInTheDocument();
  });

  it('exibe a lista de operações (data, par, resultado) quando há histórico', async () => {
    opsMock.mockResolvedValue([OPERATION]);
    render(<YieldPanel />);

    expect(await screen.findByText('BTC/ETH')).toBeInTheDocument();
    expect(screen.getByText(/\+1\.2%/)).toBeInTheDocument();
    expect(screen.getByText(/2026-05-30/)).toBeInTheDocument();
  });

  it('atualiza automaticamente quando os dados mudam (polling)', async () => {
    opsMock.mockResolvedValueOnce([]).mockResolvedValue([OPERATION]);
    render(<YieldPanel pollIntervalMs={20} />);

    // 1ª carga: vazio
    expect(await screen.findByText(/sem operações/i)).toBeInTheDocument();
    // após o polling, a operação aparece
    expect(await screen.findByText('BTC/ETH')).toBeInTheDocument();
  });

  it('exibe loading enquanto carrega', () => {
    portfolioMock.mockReturnValue(new Promise(() => {}));
    opsMock.mockReturnValue(new Promise(() => {}));
    render(<YieldPanel />);
    expect(screen.getByText(/carregando|loading/i)).toBeInTheDocument();
  });
});
