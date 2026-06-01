/**
 * TRIAX-6 — Conectar wallet via RainbowKit
 *
 * Fase TDD: RED. Apenas testes; a implementação é um stub que lança
 * "Not implemented". Wallet (wagmi/RainbowKit) e backend de sessão são
 * MOCKADOS — nenhuma carteira, rede ou servidor real é acionado.
 *
 * Espera-se que TODOS os testes deste arquivo FALHEM nesta fase.
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ConnectWalletButton } from '@/components/wallet/ConnectWalletButton';
import * as session from '@/lib/auth/session';

// MOCK do wagmi/RainbowKit — hooks de carteira controlados pelo teste.
const mockConnect = jest.fn();
const mockDisconnect = jest.fn();
const mockSignTypedDataAsync = jest.fn();
let mockAccount: { address?: string; isConnected: boolean } = { isConnected: false };

jest.mock('wagmi', () => ({
  useAccount: () => mockAccount,
  useConnect: () => ({
    connect: mockConnect,
    connectors: [{ id: 'mock', name: 'MockWallet' }],
  }),
  useDisconnect: () => ({ disconnect: mockDisconnect }),
  useSignTypedData: () => ({ signTypedDataAsync: mockSignTypedDataAsync }),
}));

// MOCK do backend de sessão (assinatura EIP-712 -> JWT).
jest.mock('@/lib/auth/session');
const mockedSession = session as jest.Mocked<typeof session>;

const ADDRESS = '0x1234567890abcdef1234567890abcdef12345678';

describe('TRIAX-6 — conectar wallet via RainbowKit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAccount = { isConnected: false };
  });

  // Critério de aceitação: o botão "Connect Wallet" renderiza.
  it('renderiza o botão "Connect Wallet" quando desconectado', () => {
    render(<ConnectWalletButton />);
    expect(screen.getByRole('button', { name: /connect wallet/i })).toBeInTheDocument();
  });

  // Critério de aceitação: ao conectar, dispara a assinatura EIP-712 (MOCK).
  it('dispara a assinatura EIP-712 ao conectar', async () => {
    mockAccount = { address: ADDRESS, isConnected: true };
    mockSignTypedDataAsync.mockResolvedValue('0xsignature');
    mockedSession.createSession.mockResolvedValue({ token: 'jwt-token', address: ADDRESS });

    render(<ConnectWalletButton />);
    await userEvent.click(screen.getByRole('button', { name: /assinar|entrar|sign in/i }));

    await waitFor(() => expect(mockSignTypedDataAsync).toHaveBeenCalled());
  });

  // Critério de aceitação: sessão criada após a assinatura (MOCK do backend).
  it('cria a sessão no backend após a assinatura', async () => {
    mockAccount = { address: ADDRESS, isConnected: true };
    mockSignTypedDataAsync.mockResolvedValue('0xsignature');
    mockedSession.createSession.mockResolvedValue({ token: 'jwt-token', address: ADDRESS });

    render(<ConnectWalletButton />);
    await userEvent.click(screen.getByRole('button', { name: /assinar|entrar|sign in/i }));

    await waitFor(() =>
      expect(mockedSession.createSession).toHaveBeenCalledWith(ADDRESS, '0xsignature'),
    );
  });

  // Critério de aceitação: endereço abreviado aparece no header.
  it('mostra o endereço abreviado (0x1234…5678) quando conectado', () => {
    mockAccount = { address: ADDRESS, isConnected: true };
    render(<ConnectWalletButton />);
    expect(screen.getByText(/0x1234…5678/)).toBeInTheDocument();
  });

  // Critério de aceitação: o botão desconectar funciona.
  it('desconecta a carteira ao clicar em "Disconnect"', async () => {
    mockAccount = { address: ADDRESS, isConnected: true };
    render(<ConnectWalletButton />);
    await userEvent.click(screen.getByRole('button', { name: /disconnect|desconectar/i }));
    expect(mockDisconnect).toHaveBeenCalled();
  });
});
