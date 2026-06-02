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

  return (
    <div>
      <label htmlFor="strategy-pairs">Pares de moedas</label>
      <textarea
        id="strategy-pairs"
        placeholder="BTC/ETH, ETH/USDT"
        value={pairs}
        onChange={(e) => setPairs(e.target.value)}
      />

      <label htmlFor="strategy-exchanges">Exchanges alvo</label>
      <textarea
        id="strategy-exchanges"
        placeholder="binance, kraken"
        value={exchanges}
        onChange={(e) => setExchanges(e.target.value)}
      />

      <label htmlFor="strategy-commission">Comissão (%)</label>
      <input
        id="strategy-commission"
        type="number"
        max={MAX_COMMISSION_PCT}
        placeholder="10"
        value={commission}
        onChange={(e) => setCommission(e.target.value)}
      />

      <button onClick={handleSave} disabled={!canSubmit}>
        Salvar estratégia
      </button>

      {tooHigh && <p>Comissão máxima de {MAX_COMMISSION_PCT}%.</p>}
      {status === 'saving' && <p>Salvando…</p>}
      {status === 'success' && <p>Estratégia salva com sucesso!</p>}
      {status === 'error' && <p>Erro: {error}</p>}
    </div>
  );
}
