/**
 * components/deposit/DepositForm.tsx — UI do depósito ERC-20 (TRIAX-8).
 *
 * Fase TDD: RED. O stub lança "Not implemented" → todos devem FALHAR.
 * Mocka a borda de wallet (wagmi useAccount) e a camada de escrita
 * (lib/contract/deposit). Não toca a rede.
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// MOCK da camada de escrita (approve/deposit já testados em deposit.ts).
jest.mock('@/lib/contract/deposit', () => ({
  approveToken: jest.fn(),
  depositFunds: jest.fn(),
}));
import { approveToken, depositFunds } from '@/lib/contract/deposit';

// MOCK da wallet: investidor conectado por padrão.
let mockAccount: { address?: string; isConnected: boolean } = {
  address: '0x1234567890abcdef1234567890abcdef12345678',
  isConnected: true,
};
jest.mock('wagmi', () => ({ useAccount: () => mockAccount }));

import { DepositForm } from '@/components/deposit/DepositForm';

const approveMock = approveToken as jest.Mock;
const depositMock = depositFunds as jest.Mock;

describe('DepositForm — fluxo de depósito (TRIAX-8)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAccount = { address: '0x1234567890abcdef1234567890abcdef12345678', isConnected: true };
    approveMock.mockResolvedValue('0xapprove');
    depositMock.mockResolvedValue('0xdeposit');
  });

  it('renderiza o campo de valor e o botão "Depositar"', () => {
    render(<DepositForm />);
    expect(screen.getByRole('spinbutton')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /depositar/i })).toBeInTheDocument();
  });

  it('mantém o botão desabilitado quando o valor é vazio ou zero', async () => {
    render(<DepositForm />);
    const button = screen.getByRole('button', { name: /depositar/i });
    expect(button).toBeDisabled();

    await userEvent.type(screen.getByRole('spinbutton'), '0');
    expect(button).toBeDisabled();
  });

  it('dispara approveToken e depois depositFunds na ordem certa', async () => {
    render(<DepositForm />);
    await userEvent.type(screen.getByRole('spinbutton'), '100');
    await userEvent.click(screen.getByRole('button', { name: /depositar/i }));

    await waitFor(() => expect(depositMock).toHaveBeenCalled());
    expect(approveMock).toHaveBeenCalled();
    expect(approveMock.mock.invocationCallOrder[0]).toBeLessThan(
      depositMock.mock.invocationCallOrder[0],
    );
  });

  it('exibe "Aprovando..." durante o approve', async () => {
    approveMock.mockReturnValue(new Promise(() => {})); // nunca resolve
    render(<DepositForm />);
    await userEvent.type(screen.getByRole('spinbutton'), '100');
    await userEvent.click(screen.getByRole('button', { name: /depositar/i }));

    expect(await screen.findByText(/aprovando/i)).toBeInTheDocument();
  });

  it('exibe "Depositando..." durante o deposit', async () => {
    depositMock.mockReturnValue(new Promise(() => {})); // nunca resolve
    render(<DepositForm />);
    await userEvent.type(screen.getByRole('spinbutton'), '100');
    await userEvent.click(screen.getByRole('button', { name: /depositar/i }));

    expect(await screen.findByText(/depositando/i)).toBeInTheDocument();
  });

  it('exibe mensagem de sucesso após a confirmação', async () => {
    render(<DepositForm />);
    await userEvent.type(screen.getByRole('spinbutton'), '100');
    await userEvent.click(screen.getByRole('button', { name: /depositar/i }));

    expect(await screen.findByText(/sucesso|conclu[ií]/i)).toBeInTheDocument();
  });

  it('exibe mensagem de erro se o usuário rejeitar na wallet', async () => {
    approveMock.mockRejectedValue(new Error('User rejected the request'));
    render(<DepositForm />);
    await userEvent.type(screen.getByRole('spinbutton'), '100');
    await userEvent.click(screen.getByRole('button', { name: /depositar/i }));

    expect(await screen.findByText(/erro|falh|rejei|recus/i)).toBeInTheDocument();
  });

  it('não permite depósito quando a wallet não está conectada', () => {
    mockAccount = { isConnected: false };
    render(<DepositForm />);

    expect(screen.getByText(/conecte/i)).toBeInTheDocument();
    expect(approveMock).not.toHaveBeenCalled();
  });
});
