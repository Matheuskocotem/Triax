/**
 * components/dashboard/StrategyForm.tsx — gestor configura a estratégia (TRIAX-12).
 *
 * Fase TDD: RED. O stub lança "Not implemented" → todos devem FALHAR.
 * Mocka a escrita (saveStrategy), a checagem de gestor (fetchManagerData) e a
 * wallet (wagmi). Só o gestor conectado vê e usa o formulário.
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

jest.mock('@/lib/contract/managerContract', () => ({ fetchManagerData: jest.fn() }));
jest.mock('@/lib/contract/deposit', () => ({ saveStrategy: jest.fn() }));
import { fetchManagerData } from '@/lib/contract/managerContract';
import { saveStrategy } from '@/lib/contract/deposit';

let mockAccount: { address?: string; isConnected: boolean } = {
  address: '0x1234567890abcdef1234567890abcdef12345678',
  isConnected: true,
};
jest.mock('wagmi', () => ({ useAccount: () => mockAccount }));

import { StrategyForm } from '@/components/dashboard/StrategyForm';

const saveMock = saveStrategy as jest.Mock;
const managerMock = fetchManagerData as jest.Mock;

function manager(address: string) {
  return { address, name: 'Mesa Alpha', strategy: 'Tri', apy: 0, status: 'active' as const };
}

async function fillFields() {
  await userEvent.type(screen.getByLabelText(/pares/i), 'BTC/ETH, ETH/USDT');
  await userEvent.type(screen.getByLabelText(/exchanges/i), 'binance, kraken');
  await userEvent.type(screen.getByLabelText(/comiss/i), '20');
}

describe('StrategyForm — estratégia configurável (TRIAX-12)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAccount = { address: '0x1234567890abcdef1234567890abcdef12345678', isConnected: true };
    managerMock.mockResolvedValue(manager('0x1234567890abcdef1234567890abcdef12345678'));
    saveMock.mockResolvedValue('0xhash');
  });

  it('só renderiza o formulário se o endereço conectado é gestor', async () => {
    render(<StrategyForm />);
    // Campos do gestor aparecem
    expect(await screen.findByLabelText(/pares/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/exchanges/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/comiss/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /salvar estrat/i })).toBeInTheDocument();
  });

  it('não renderiza o formulário se o endereço não é gestor', async () => {
    managerMock.mockRejectedValue(new Error('Gestor não encontrado on-chain'));
    render(<StrategyForm />);

    await waitFor(() => expect(managerMock).toHaveBeenCalled());
    expect(screen.queryByLabelText(/pares/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /salvar estrat/i })).not.toBeInTheDocument();
  });

  it('invalida a comissão acima de 30%', async () => {
    render(<StrategyForm />);
    await screen.findByLabelText(/pares/i);

    await userEvent.type(screen.getByLabelText(/comiss/i), '40');

    expect(await screen.findByText(/m[áa]xim|30%/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /salvar estrat/i })).toBeDisabled();
  });

  it('dispara setStrategy ao clicar em "Salvar estratégia"', async () => {
    render(<StrategyForm />);
    await screen.findByLabelText(/pares/i);

    await fillFields();
    await userEvent.click(screen.getByRole('button', { name: /salvar estrat/i }));

    await waitFor(() => expect(saveMock).toHaveBeenCalled());
  });

  it('exibe sucesso após a confirmação', async () => {
    render(<StrategyForm />);
    await screen.findByLabelText(/pares/i);

    await fillFields();
    await userEvent.click(screen.getByRole('button', { name: /salvar estrat/i }));

    expect(await screen.findByText(/sucesso|conclu[ií]/i)).toBeInTheDocument();
  });

  it('exibe erro se a wallet rejeitar a transação', async () => {
    saveMock.mockRejectedValue(new Error('User rejected the request'));
    render(<StrategyForm />);
    await screen.findByLabelText(/pares/i);

    await fillFields();
    await userEvent.click(screen.getByRole('button', { name: /salvar estrat/i }));

    expect(await screen.findByText(/erro|rejei|falh/i)).toBeInTheDocument();
  });
});
