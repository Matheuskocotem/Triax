/**
 * components/dashboard/WithdrawForm.tsx — saque de fundos (TRIAX-11).
 *
 * Fase TDD: RED. O stub lança "Not implemented" → todos devem FALHAR.
 * Mocka a escrita (withdrawFunds), o saldo (fetchPortfolio) e a wallet (wagmi).
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

jest.mock('@/lib/contract/deposit', () => ({ withdrawFunds: jest.fn() }));
jest.mock('@/lib/contract/managerContract', () => ({ fetchPortfolio: jest.fn() }));
import { withdrawFunds } from '@/lib/contract/deposit';
import { fetchPortfolio } from '@/lib/contract/managerContract';

let mockAccount: { address?: string; isConnected: boolean } = {
  address: '0x1234567890abcdef1234567890abcdef12345678',
  isConnected: true,
};
jest.mock('wagmi', () => ({ useAccount: () => mockAccount }));

import { WithdrawForm } from '@/components/dashboard/WithdrawForm';

const withdrawMock = withdrawFunds as jest.Mock;
const portfolioMock = fetchPortfolio as jest.Mock;

function portfolio(balance: string) {
  return { balance, yield: '0', status: 'active', positions: [] };
}

describe('WithdrawForm — saque (TRIAX-11)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAccount = { address: '0x1234567890abcdef1234567890abcdef12345678', isConnected: true };
    portfolioMock.mockResolvedValue(portfolio('100'));
    withdrawMock.mockResolvedValue('0xhash');
  });

  it('renderiza o campo de valor e o botão "Sacar"', async () => {
    render(<WithdrawForm />);
    expect(await screen.findByRole('spinbutton')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sacar/i })).toBeInTheDocument();
  });

  it('desabilita o botão quando o valor é zero ou maior que o saldo', async () => {
    render(<WithdrawForm />);
    await screen.findByText(/saldo dispon[ií]vel/i);
    const button = screen.getByRole('button', { name: /sacar/i });
    expect(button).toBeDisabled();

    await userEvent.type(screen.getByRole('spinbutton'), '200');
    expect(button).toBeDisabled();
  });

  it('dispara withdraw ao clicar em "Sacar"', async () => {
    render(<WithdrawForm />);
    await screen.findByText(/saldo dispon[ií]vel/i);
    await userEvent.type(screen.getByRole('spinbutton'), '40');
    await userEvent.click(screen.getByRole('button', { name: /sacar/i }));

    await waitFor(() => expect(withdrawMock).toHaveBeenCalled());
  });

  it('exibe "Sacando..." durante a transação', async () => {
    withdrawMock.mockReturnValue(new Promise(() => {}));
    render(<WithdrawForm />);
    await screen.findByText(/saldo dispon[ií]vel/i);
    await userEvent.type(screen.getByRole('spinbutton'), '40');
    await userEvent.click(screen.getByRole('button', { name: /sacar/i }));

    expect(await screen.findByText(/sacando/i)).toBeInTheDocument();
  });

  it('exibe sucesso e o saldo atualizado após a confirmação', async () => {
    portfolioMock.mockResolvedValueOnce(portfolio('100')).mockResolvedValue(portfolio('60'));
    render(<WithdrawForm />);
    await screen.findByText(/saldo dispon[ií]vel:\s*100/i);
    await userEvent.type(screen.getByRole('spinbutton'), '40');
    await userEvent.click(screen.getByRole('button', { name: /sacar/i }));

    expect(await screen.findByText(/sucesso|conclu[ií]/i)).toBeInTheDocument();
    expect(await screen.findByText(/saldo dispon[ií]vel:\s*60/i)).toBeInTheDocument();
  });

  it('exibe erro se o usuário rejeitar na wallet', async () => {
    withdrawMock.mockRejectedValue(new Error('User rejected the request'));
    render(<WithdrawForm />);
    await screen.findByText(/saldo dispon[ií]vel/i);
    await userEvent.type(screen.getByRole('spinbutton'), '40');
    await userEvent.click(screen.getByRole('button', { name: /sacar/i }));

    expect(await screen.findByText(/erro|rejei|falh/i)).toBeInTheDocument();
  });

  it('exibe "Saldo insuficiente" quando o valor excede o saldo', async () => {
    render(<WithdrawForm />);
    await screen.findByText(/saldo dispon[ií]vel/i);
    await userEvent.type(screen.getByRole('spinbutton'), '200');

    expect(await screen.findByText(/saldo insuficiente/i)).toBeInTheDocument();
  });
});
