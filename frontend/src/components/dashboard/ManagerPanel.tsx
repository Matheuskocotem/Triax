'use client';

// Painel do gestor: total sob gestão, investidores e comissão (TRIAX-10).
// Só mostra os números quando o endereço conectado é um gestor registrado.

import React, { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';

import { fetchManagerStats, ManagerStats } from '@/lib/contract/managerContract';

type State =
  | { phase: 'loading' }
  | { phase: 'not-manager' }
  | { phase: 'loaded'; stats: ManagerStats };

export function ManagerPanel(): JSX.Element {
  const { address, isConnected } = useAccount();
  const [state, setState] = useState<State>({ phase: 'loading' });

  useEffect(() => {
    if (!isConnected || !address) return;
    let active = true;
    setState({ phase: 'loading' });
    fetchManagerStats(address)
      .then((stats) => {
        if (active) setState({ phase: 'loaded', stats });
      })
      .catch(() => {
        if (active) setState({ phase: 'not-manager' });
      });
    return () => {
      active = false;
    };
  }, [address, isConnected]);

  if (!isConnected || !address) {
    return <p>Conecte sua carteira.</p>;
  }
  if (state.phase === 'loading') {
    return <p>Carregando…</p>;
  }
  if (state.phase === 'not-manager') {
    return <p>Você não é um gestor registrado.</p>;
  }

  const { stats } = state;
  return (
    <section>
      <p>Total sob gestão: {stats.totalDeposited}</p>
      <p>Investidores: {stats.investorCount}</p>
      <p>Comissão acumulada: {stats.commissionAccrued}</p>
    </section>
  );
}
