'use client';

// Formulário de saque (TRIAX-11). Mostra o saldo atual, valida o valor e
// dispara o withdraw no contrato, atualizando o saldo após a confirmação.

import React, { useEffect, useMemo, useState } from 'react';
import { useAccount } from 'wagmi';
import { parseUnits } from 'viem';

import { fetchPortfolio } from '@/lib/contract/managerContract';
import { withdrawFunds } from '@/lib/contract/deposit';

const DECIMALS = 18;

type Status = 'idle' | 'withdrawing' | 'success' | 'error';

export function WithdrawForm(): JSX.Element {
  const { address, isConnected } = useAccount();
  const [balance, setBalance] = useState<string | null>(null);
  const [value, setValue] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');

  async function loadBalance(account: string) {
    const portfolio = await fetchPortfolio(account);
    setBalance(portfolio.balance);
  }

  useEffect(() => {
    if (!isConnected || !address) return;
    loadBalance(address);
  }, [address, isConnected]);

  const amount = useMemo(() => {
    try {
      return value ? parseUnits(value, DECIMALS) : BigInt(0);
    } catch {
      return BigInt(0);
    }
  }, [value]);

  const max = useMemo(() => {
    try {
      return balance ? parseUnits(balance, DECIMALS) : BigInt(0);
    } catch {
      return BigInt(0);
    }
  }, [balance]);

  const insufficient = amount > max;
  const busy = status === 'withdrawing';
  const canSubmit = isConnected && amount > BigInt(0) && !insufficient && !busy;

  async function handleWithdraw() {
    if (!canSubmit || !address) return;
    setError('');
    try {
      setStatus('withdrawing');
      await withdrawFunds(amount);
      await loadBalance(address); // saldo atualizado após o saque
      setStatus('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha no saque');
      setStatus('error');
    }
  }

  if (!isConnected || !address) {
    return (
      <p className="rounded-xl border border-gray-800 bg-gray-900/60 px-6 py-5 text-gray-400">
        Conecte sua carteira para sacar.
      </p>
    );
  }
  if (balance === null) {
    return (
      <p className="rounded-xl border border-gray-800 bg-gray-900/60 px-6 py-5 text-gray-400">Carregando…</p>
    );
  }

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400">Sacar</h3>
        <p className="text-sm font-medium text-gray-200">Saldo disponível: {balance}</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="number"
          aria-label="Valor do saque"
          placeholder="0.0"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-white placeholder-gray-500 outline-none transition focus:border-violet-500"
        />
        <button
          onClick={handleWithdraw}
          disabled={!canSubmit}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-5 py-2 font-medium text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          )}
          Sacar
        </button>
      </div>

      {insufficient && <p className="mt-3 text-sm text-red-400">Saldo insuficiente.</p>}
      {status === 'withdrawing' && <p className="mt-3 text-sm text-violet-300">Sacando…</p>}
      {status === 'success' && <p className="mt-3 text-sm text-green-400">Saque concluído com sucesso!</p>}
      {status === 'error' && <p className="mt-3 text-sm text-red-400">Erro: {error}</p>}
    </div>
  );
}
