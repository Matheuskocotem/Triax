/**
 * Integração de PÁGINA (Iteration 1) — App Router ligando os componentes ao
 * reader REAL (managerContract.ts → viem → rede Hardhat local).
 *
 * Mocka APENAS a borda de conexão de wallet (wagmi/RainbowKit). O contrato NÃO
 * é mockado: os dados vêm do Triax.sol semeado por scripts/deploy.ts.
 *
 * Fase TDD: RED — a página ainda não liga os componentes, então deve FALHAR.
 * Pré-requisitos: node Hardhat em :8545 + deploy.ts executado (gera o manifest).
 */
import React from 'react';
import { render, screen } from '@testing-library/react';

import { deployment as manifest } from '@/lib/contract/deployment';
import HomePage from '@/app/page';

// Borda de wallet: endereço "conectado" é mutável para alternar entre o
// investidor e o gestor do seed (prefixo `mock` exigido pelo hoist do jest.mock).
let mockAddress: string = manifest.seed.investor;
jest.mock('wagmi', () => ({
  useAccount: () => ({ address: mockAddress, isConnected: true }),
  useConnect: () => ({ connect: jest.fn(), connectors: [{ id: 'mock', name: 'Mock' }] }),
  useDisconnect: () => ({ disconnect: jest.fn() }),
  useSignTypedData: () => ({ signTypedDataAsync: jest.fn() }),
}));

// Camadas de escrita (deposit.ts → config.ts → wagmi ESM) e de bot/sessão
// mockadas: a página só precisa renderizar, não escrever nem chamar a API.
jest.mock('@/lib/contract/deposit', () => ({
  approveToken: jest.fn(),
  depositFunds: jest.fn(),
  withdrawFunds: jest.fn(),
  saveStrategy: jest.fn(),
}));
jest.mock('@/lib/api/operations', () => ({ fetchOperations: jest.fn().mockResolvedValue([]) }));
jest.mock('@/lib/auth/session', () => ({ getSession: jest.fn().mockReturnValue(null) }));

// URL com o gestor do seed: ?manager=<seed.manager>.
jest.mock('next/navigation', () => {
  const { deployment } = require('@/lib/contract/deployment');
  return {
    useSearchParams: () => new URLSearchParams(`manager=${deployment.seed.manager}`),
  };
});

describe('Página inicial (Iteration 1) com reader real', () => {
  // Por padrão, o investidor do seed está conectado (tem posição).
  beforeEach(() => {
    mockAddress = manifest.seed.investor;
  });

  // Dado ?manager= válido → ManagerCard com dados reais do contrato.
  it('renderiza o ManagerCard com os dados reais do gestor', async () => {
    render(<HomePage />);

    expect(await screen.findByText(manifest.seed.managerData.name)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(manifest.seed.managerData.strategy))).toBeInTheDocument();
  });

  // Dado wallet conectada → PortfolioPanel com saldo e rendimento reais.
  it('renderiza o PortfolioPanel com saldo e rendimento reais', async () => {
    render(<HomePage />);

    // seed: depósito de 1 ETH e rendimento de 0.05 ETH (formatEther → "1"/"0.05").
    expect(await screen.findByText(/saldo:\s*1\b/i)).toBeInTheDocument();
    expect(screen.getByText(/rendimento:\s*0\.05/i)).toBeInTheDocument();
  });

  // O header monta o controle de wallet (mockada como conectada → "Disconnect").
  it('monta o controle de wallet no header', () => {
    render(<HomePage />);
    expect(screen.getByRole('button', { name: /disconnect|desconectar/i })).toBeInTheDocument();
  });

  // Wallet conectada + posição → YieldPanel (variação do rendimento) aparece.
  it('exibe o YieldPanel quando a wallet está conectada e há posição', async () => {
    render(<HomePage />);
    expect(await screen.findByText(/varia[çc][ãa]o/i)).toBeInTheDocument();
  });

  // Wallet conectada + posição → WithdrawForm (campo de saque) aparece.
  it('exibe o WithdrawForm quando a wallet está conectada e há posição', async () => {
    render(<HomePage />);
    expect(await screen.findByLabelText(/valor do saque/i)).toBeInTheDocument();
  });

  // Endereço conectado é gestor → ManagerPanel (agregado) aparece.
  it('exibe o ManagerPanel quando o endereço conectado é gestor', async () => {
    mockAddress = manifest.seed.manager;
    render(<HomePage />);
    expect(await screen.findByText(/total sob gest[ãa]o/i)).toBeInTheDocument();
  });

  // Endereço conectado é gestor → StrategyForm (campos da estratégia) aparece.
  it('exibe o StrategyForm quando o endereço conectado é gestor', async () => {
    mockAddress = manifest.seed.manager;
    render(<HomePage />);
    expect(await screen.findByLabelText(/pares/i)).toBeInTheDocument();
  });
});
