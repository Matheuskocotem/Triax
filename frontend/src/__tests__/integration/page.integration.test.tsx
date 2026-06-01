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

// Borda de wallet: investidor do seed "conectado". require() dentro do factory
// porque jest.mock é içado acima dos imports.
jest.mock('wagmi', () => {
  const { deployment } = require('@/lib/contract/deployment');
  return {
    useAccount: () => ({ address: deployment.seed.investor, isConnected: true }),
    useConnect: () => ({ connect: jest.fn(), connectors: [{ id: 'mock', name: 'Mock' }] }),
    useDisconnect: () => ({ disconnect: jest.fn() }),
    useSignTypedData: () => ({ signTypedDataAsync: jest.fn() }),
  };
});

// URL com o gestor do seed: ?manager=<seed.manager>.
jest.mock('next/navigation', () => {
  const { deployment } = require('@/lib/contract/deployment');
  return {
    useSearchParams: () => new URLSearchParams(`manager=${deployment.seed.manager}`),
  };
});

describe('Página inicial (Iteration 1) com reader real', () => {
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
});
