'use client';

// Painel de acompanhamento de rendimentos em tempo real (TRIAX-9).
// Lê saldo/rendimento do contrato + histórico de operações do bot, com polling.

import React, { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';

import { fetchPortfolio, PortfolioData } from '@/lib/contract/managerContract';
import { fetchOperations, Operation } from '@/lib/api/operations';
import { getSession } from '@/lib/auth/session';

const DEFAULT_POLL_MS = 20_000;

export interface YieldPanelProps {
  /** Intervalo de polling em ms (20s em prod; menor nos testes). */
  pollIntervalMs?: number;
}

export function YieldPanel({ pollIntervalMs = DEFAULT_POLL_MS }: YieldPanelProps): JSX.Element {
  const { address, isConnected } = useAccount();
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [operations, setOperations] = useState<Operation[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isConnected || !address) return;
    const account = address;
    let active = true;

    async function load() {
      try {
        const token = getSession() ?? '';
        const [p, ops] = await Promise.all([
          fetchPortfolio(account),
          fetchOperations(account, token),
        ]);
        if (!active) return;
        setPortfolio(p);
        setOperations(ops);
        setLoading(false);
      } catch {
        if (active) setLoading(false);
      }
    }

    load();
    const id = setInterval(load, pollIntervalMs);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [address, isConnected, pollIntervalMs]);

  if (loading || !portfolio || !operations) {
    return <p>Carregando…</p>;
  }

  const balance = Number(portfolio.balance);
  const variation = balance > 0 ? (Number(portfolio.yield) / balance) * 100 : 0;

  return (
    <section>
      <p>Rendimento acumulado: {portfolio.yield}</p>
      <p>Variação: {variation.toFixed(2)}%</p>

      {operations.length === 0 ? (
        <p>Sem operações.</p>
      ) : (
        <ul>
          {operations.map((op) => (
            <li key={op.id}>
              <span>{op.date}</span>
              <span>{op.pair}</span>
              <span>{op.result}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
