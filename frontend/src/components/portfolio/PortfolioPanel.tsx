'use client';

// Saldo e posições do investidor conectado (TRIAX-7).
// Sem carteira -> convite a conectar. Conectado: carregando -> erro / vazio /
// dados (saldo, rendimento, status e lista de posições).

import React, { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';

import { fetchPortfolio, PortfolioData } from '@/lib/contract/managerContract';

type State =
  | { phase: 'loading' }
  | { phase: 'error' }
  | { phase: 'loaded'; data: PortfolioData };

export function PortfolioPanel(): JSX.Element {
  const { address, isConnected } = useAccount();
  const [state, setState] = useState<State>({ phase: 'loading' });

  useEffect(() => {
    if (!isConnected || !address) return;
    let active = true;
    setState({ phase: 'loading' });
    fetchPortfolio(address)
      .then((data) => {
        if (active) setState({ phase: 'loaded', data });
      })
      .catch(() => {
        if (active) setState({ phase: 'error' });
      });
    return () => {
      active = false;
    };
  }, [address, isConnected]);

  // Guarda: sem carteira conectada não lê o contrato.
  if (!isConnected || !address) {
    return <div>Conecte sua carteira para ver seu saldo.</div>;
  }

  if (state.phase === 'loading') {
    return <div role="status">Carregando…</div>;
  }

  if (state.phase === 'error') {
    return <div role="alert">Ocorreu um erro ao ler o contrato.</div>;
  }

  const { data } = state;

  if (data.positions.length === 0) {
    return <div>Você ainda não investiu — nenhuma posição.</div>;
  }

  return (
    <section>
      <p>Saldo: {data.balance}</p>
      <p>Rendimento: {data.yield}</p>
      <p>Status: {data.status}</p>
      <ul>
        {data.positions.map((position) => (
          <li key={position.asset}>{position.asset}</li>
        ))}
      </ul>
    </section>
  );
}
