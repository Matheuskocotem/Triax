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
    return (
      <p className="rounded-xl border border-gray-800 bg-gray-900/60 px-6 py-5 text-gray-400">
        Conecte sua carteira.
      </p>
    );
  }
  if (state.phase === 'loading') {
    return (
      <p className="rounded-xl border border-gray-800 bg-gray-900/60 px-6 py-5 text-gray-400">Carregando…</p>
    );
  }
  if (state.phase === 'not-manager') {
    return (
      <p className="rounded-xl border border-gray-800 bg-gray-900/60 px-6 py-5 text-gray-500">
        Você não é um gestor registrado.
      </p>
    );
  }

  const { stats } = state;

  return (
    <section className="rounded-xl border border-gray-800 bg-gray-900/60 p-6">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">Painel do gestor</h3>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-800 bg-gray-950/60 p-4">
          <p className="text-lg font-semibold text-violet-400">Total sob gestão: {stats.totalDeposited}</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-950/60 p-4">
          <p className="text-lg font-semibold text-violet-400">Investidores: {stats.investorCount}</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-950/60 p-4">
          <p className="text-lg font-semibold text-violet-400">Comissão acumulada: {stats.commissionAccrued}</p>
        </div>
      </div>
    </section>
  );
}
