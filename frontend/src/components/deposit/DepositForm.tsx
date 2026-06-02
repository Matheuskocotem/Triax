'use client';

// Formulário de depósito ERC-20 (approve + deposit) — TRIAX-8.
// Orquestra os dois passos do fluxo e reflete cada estado na UI.

import React, { useMemo, useState } from 'react';
import { useAccount } from 'wagmi';
import { parseUnits } from 'viem';

import { approveToken, depositFunds } from '@/lib/contract/deposit';
import { useManagerAddress } from '@/hooks/useManagerAddress';

// Token de 18 casas (MockERC20 local). USDT real (6) seria nova história.
const DECIMALS = 18;

type Status = 'idle' | 'approving' | 'depositing' | 'success' | 'error';

export function DepositForm(): JSX.Element {
  const { isConnected } = useAccount();
  const manager = useManagerAddress();
  const [value, setValue] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');

  const amount = useMemo(() => {
    try {
      return value ? parseUnits(value, DECIMALS) : BigInt(0);
    } catch {
      return BigInt(0);
    }
  }, [value]);

  const busy = status === 'approving' || status === 'depositing';
  const canSubmit = isConnected && !!manager && amount > BigInt(0) && !busy;

  async function handleDeposit() {
    if (!canSubmit || !manager) return;
    setError('');
    try {
      setStatus('approving');
      await approveToken(amount);
      setStatus('depositing');
      await depositFunds(amount, manager as `0x${string}`);
      setStatus('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha no depósito');
      setStatus('error');
    }
  }

  if (!isConnected) {
    return (
      <p className="rounded-xl border border-gray-800 bg-gray-900/60 px-6 py-5 text-gray-400">
        Conecte sua carteira para depositar.
      </p>
    );
  }

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-6">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">Depositar</h3>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="number"
          aria-label="Valor do depósito"
          placeholder="0.0"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-white placeholder-gray-500 outline-none transition focus:border-violet-500"
        />
        <button
          onClick={handleDeposit}
          disabled={!canSubmit}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-5 py-2 font-medium text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          )}
          Depositar
        </button>
      </div>

      {status === 'approving' && <p className="mt-3 text-sm text-violet-300">Aprovando…</p>}
      {status === 'depositing' && <p className="mt-3 text-sm text-violet-300">Depositando…</p>}
      {status === 'success' && <p className="mt-3 text-sm text-green-400">Depósito concluído com sucesso!</p>}
      {status === 'error' && <p className="mt-3 text-sm text-red-400">Erro: {error}</p>}
    </div>
  );
}
