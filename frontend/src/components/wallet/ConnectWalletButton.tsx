'use client';

// Conectar wallet + autenticação por assinatura EIP-712 (TRIAX-6).
// Desconectado: botão "Connect Wallet". Conectado: endereço abreviado,
// botão "Entrar" (assina EIP-712 e cria a sessão) e botão "Disconnect".

import React from 'react';
import { useAccount, useConnect, useDisconnect, useSignTypedData } from 'wagmi';

import { createSession } from '@/lib/auth/session';

/** Abrevia 0x1234567890…12345678 -> 0x1234…5678 */
function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

// Domínio/typed-data da sessão Triax (assinatura sem custo, só prova de posse).
const SESSION_TYPED_DATA = {
  domain: { name: 'Triax', version: '1' },
  types: {
    Session: [
      { name: 'action', type: 'string' },
      { name: 'address', type: 'address' },
    ],
  },
  primaryType: 'Session',
} as const;

export function ConnectWalletButton(): JSX.Element {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { signTypedDataAsync } = useSignTypedData();

  async function handleSignIn() {
    if (!address) return;
    const signature = await signTypedDataAsync({
      ...SESSION_TYPED_DATA,
      message: { action: 'sign-in', address },
    });
    await createSession(address, signature);
  }

  if (!isConnected || !address) {
    return (
      <button onClick={() => connect({ connector: connectors[0] })}>
        Connect Wallet
      </button>
    );
  }

  return (
    <div>
      <span>{shortenAddress(address)}</span>
      <button onClick={handleSignIn}>Entrar</button>
      <button onClick={() => disconnect()}>Disconnect</button>
    </div>
  );
}
