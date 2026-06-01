/**
 * TRIAX-7 — Ver saldo e posições no contrato
 *
 * Fase TDD: RED. Apenas testes; a implementação é um stub que lança
 * "Not implemented". A carteira (wagmi) e o smart contract são MOCKADOS —
 * nenhuma leitura on-chain real acontece aqui.
 *
 * Espera-se que TODOS os testes deste arquivo FALHEM nesta fase.
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

import { PortfolioPanel } from '@/components/portfolio/PortfolioPanel';
import * as managerContract from '@/lib/contract/managerContract';

// MOCK da carteira — controla se há (ou não) conexão.
let mockAccount: { address?: string; isConnected: boolean } = { isConnected: false };
jest.mock('wagmi', () => ({
  useAccount: () => mockAccount,
}));

// MOCK do smart contract — substitui as leituras on-chain por jest.fn().
jest.mock('@/lib/contract/managerContract');
const mockedContract = managerContract as jest.Mocked<typeof managerContract>;

const ADDRESS = '0x1234567890abcdef1234567890abcdef12345678';

describe('TRIAX-7 — saldo e posições no contrato', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  mockAccount = { address: ADDRESS, isConnected: true };
  });

  // Critério de aceitação: loading state durante a leitura.
  it('exibe estado de carregamento enquanto lê o contrato', () => {
    // promise que nunca resolve -> mantém o componente em "loading"
    mockedContract.fetchPortfolio.mockReturnValue(new Promise<never>(() => {}));
    render(<PortfolioPanel />);
    expect(screen.getByText(/carregando|loading/i)).toBeInTheDocument();
  });

  // Critério de aceitação: após conexão, lê saldo e posições (MOCK) e
  // exibe saldo, rendimento e status.
  it('após conexão, lê e exibe saldo, rendimento e status', async () => {
    mockedContract.fetchPortfolio.mockResolvedValue({
      balance: '1000.00',
      yield: '42.50',
      status: 'active',
      positions: [{ asset: 'USDT', amount: '1000.00' }],
    });

    render(<PortfolioPanel />);

    await waitFor(() => expect(mockedContract.fetchPortfolio).toHaveBeenCalledWith(ADDRESS));
    expect(await screen.findByText(/1000\.00/)).toBeInTheDocument();
    expect(screen.getByText(/42\.50/)).toBeInTheDocument();
    expect(screen.getByText(/active/i)).toBeInTheDocument();
  });

  // Critério de aceitação: estado vazio se não há posição.
  it('exibe estado vazio quando não há nenhuma posição', async () => {
    mockedContract.fetchPortfolio.mockResolvedValue({
      balance: '0',
      yield: '0',
      status: 'empty',
      positions: [],
    });

    render(<PortfolioPanel />);
    expect(
      await screen.findByText(/nenhuma posição|sem posições|você ainda não investiu/i),
    ).toBeInTheDocument();
  });

  // Critério de aceitação: trata erro de leitura.
  it('exibe mensagem de erro quando a leitura do contrato falha', async () => {
    mockedContract.fetchPortfolio.mockRejectedValue(new Error('RPC indisponível'));
    render(<PortfolioPanel />);
    expect(await screen.findByText(/erro|falha/i)).toBeInTheDocument();
  });

  // Critério de aceitação (guarda): não lê o contrato sem carteira conectada
  // e convida o usuário a conectar. O anchor positivo garante RED enquanto o
  // componente não estiver implementado (não basta "não chamar o contrato").
  it('não lê o contrato e pede conexão quando a carteira está desconectada', () => {
    mockAccount = { isConnected: false };
    render(<PortfolioPanel />);
    expect(screen.getByText(/conecte sua carteira|connect wallet|conectar/i)).toBeInTheDocument();
    expect(mockedContract.fetchPortfolio).not.toHaveBeenCalled();
  });
});
