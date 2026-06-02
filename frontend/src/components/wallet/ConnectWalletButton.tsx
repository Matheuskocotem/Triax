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
      <button
        onClick={() => connect({ connector: connectors[0] })}
        className="rounded-full border border-violet-500 bg-violet-600/10 px-5 py-2 text-sm font-medium text-violet-300 transition hover:bg-violet-600 hover:text-white"
      >
        Connect Wallet
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="rounded-full border border-gray-700 bg-gray-900 px-3 py-1.5 font-mono text-sm text-gray-300">
        {shortenAddress(address)}
      </span>
      <button
        onClick={handleSignIn}
        className="rounded-full bg-violet-600 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-violet-500"
      >
        Entrar
      </button>
      <button
        onClick={() => disconnect()}
        className="rounded-full border border-gray-700 px-4 py-1.5 text-sm font-medium text-gray-300 transition hover:border-gray-500 hover:text-white"
      >
        Disconnect
      </button>
    </div>
  );
}
