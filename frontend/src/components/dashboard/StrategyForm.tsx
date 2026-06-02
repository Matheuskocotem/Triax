'use client';

// Formulário de configuração da estratégia do gestor (TRIAX-12).
// Só aparece para quem é gestor on-chain (fetchManagerData resolve). O gestor
// informa pares, exchanges e a comissão (%, teto 30) e grava via setStrategy.

import React, { useEffect, useMemo, useState } from 'react';
import { useAccount } from 'wagmi';

import { fetchManagerData } from '@/lib/contract/managerContract';
import { saveStrategy } from '@/lib/contract/deposit';

const MAX_COMMISSION_PCT = 30;

type Status = 'idle' | 'saving' | 'success' | 'error';

// "BTC/ETH, ETH/USDT" → ["BTC/ETH", "ETH/USDT"]
function toList(text: string): string[] {
  return text
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function StrategyForm(): JSX.Element | null {
  const { address, isConnected } = useAccount();
  const [isManager, setIsManager] = useState<boolean | null>(null);
  const [pairs, setPairs] = useState('');
  const [exchanges, setExchanges] = useState('');
  const [commission, setCommission] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isConnected || !address) {
      setIsManager(false);
      return;
    }
    let active = true;
    fetchManagerData(address)
      .then(() => active && setIsManager(true))
      .catch(() => active && setIsManager(false));
    return () => {
      active = false;
    };
  }, [address, isConnected]);

  const commissionPct = useMemo(() => {
    const n = parseFloat(commission);
    return Number.isFinite(n) ? n : 0;
  }, [commission]);

  const tooHigh = commissionPct > MAX_COMMISSION_PCT;
  const busy = status === 'saving';
  const canSubmit = !tooHigh && !busy;

  async function handleSave() {
    if (!canSubmit) return;
    setError('');
    try {
      setStatus('saving');
      // % → bps (20% → 2000)
      const commissionBps = Math.round(commissionPct * 100);
      await saveStrategy(toList(pairs), toList(exchanges), commissionBps);
      setStatus('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao salvar a estratégia');
      setStatus('error');
    }
  }

  // Só o gestor vê o formulário.
  if (!isManager) return null;

  const fieldClass =
    'w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-white placeholder-gray-500 outline-none transition focus:border-violet-500';
  const labelClass = 'mb-1 block text-sm font-medium text-gray-300';

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-6">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">Estratégia</h3>

      <div className="space-y-4">
        <div>
          <label htmlFor="strategy-pairs" className={labelClass}>Pares de moedas</label>
          <textarea
            id="strategy-pairs"
            placeholder="BTC/ETH, ETH/USDT"
            value={pairs}
            onChange={(e) => setPairs(e.target.value)}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="strategy-exchanges" className={labelClass}>Exchanges alvo</label>
          <textarea
            id="strategy-exchanges"
            placeholder="binance, kraken"
            value={exchanges}
            onChange={(e) => setExchanges(e.target.value)}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="strategy-commission" className={labelClass}>Comissão (%)</label>
          <input
            id="strategy-commission"
            type="number"
            max={MAX_COMMISSION_PCT}
            placeholder="10"
            value={commission}
            onChange={(e) => setCommission(e.target.value)}
            className={`${fieldClass} max-w-[8rem]`}
          />
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={!canSubmit}
        className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-5 py-2 font-medium text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {busy && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        )}
        Salvar estratégia
      </button>

      {tooHigh && <p className="mt-3 text-sm text-red-400">Comissão máxima de {MAX_COMMISSION_PCT}%.</p>}
      {status === 'saving' && <p className="mt-3 text-sm text-violet-300">Salvando…</p>}
      {status === 'success' && <p className="mt-3 text-sm text-green-400">Estratégia salva com sucesso!</p>}
      {status === 'error' && <p className="mt-3 text-sm text-red-400">Erro: {error}</p>}
    </div>
  );
}
