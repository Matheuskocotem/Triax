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
    return <p>Conecte sua carteira para depositar.</p>;
  }

  return (
    <div>
      <input
        type="number"
        aria-label="Valor do depósito"
        placeholder="0.0"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button onClick={handleDeposit} disabled={!canSubmit}>
        Depositar
      </button>

      {status === 'approving' && <p>Aprovando…</p>}
      {status === 'depositing' && <p>Depositando…</p>}
      {status === 'success' && <p>Depósito concluído com sucesso!</p>}
      {status === 'error' && <p>Erro: {error}</p>}
    </div>
  );
}
