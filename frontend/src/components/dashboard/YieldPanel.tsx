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
    return (
      <p className="rounded-xl border border-gray-800 bg-gray-900/60 px-6 py-5 text-gray-400">Carregando…</p>
    );
  }

  const balance = Number(portfolio.balance);
  const variation = balance > 0 ? (Number(portfolio.yield) / balance) * 100 : 0;
  const variationColor = variation >= 0 ? 'text-green-400' : 'text-red-400';

  return (
    <section className="rounded-xl border border-gray-800 bg-gray-900/60 p-6">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">Rendimentos</h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-gray-800 bg-gray-950/60 p-4">
          <p className="text-lg font-semibold text-white">Rendimento acumulado: {portfolio.yield}</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-950/60 p-4">
          <p className={`text-lg font-semibold ${variationColor}`}>Variação: {variation.toFixed(2)}%</p>
        </div>
      </div>

      {operations.length === 0 ? (
        <p className="mt-5 text-sm text-gray-500">Sem operações.</p>
      ) : (
        <table className="mt-5 w-full text-left text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-gray-500">
              <th className="pb-2 font-medium">Data</th>
              <th className="pb-2 font-medium">Par</th>
              <th className="pb-2 text-right font-medium">Resultado</th>
            </tr>
          </thead>
          <tbody>
            {operations.map((op) => (
              <tr key={op.id} className="border-t border-gray-800 odd:bg-gray-950/40">
                <td className="py-2 text-gray-300">{op.date}</td>
                <td className="py-2 font-mono text-gray-300">{op.pair}</td>
                <td className="py-2 text-right font-medium text-green-400">{op.result}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
