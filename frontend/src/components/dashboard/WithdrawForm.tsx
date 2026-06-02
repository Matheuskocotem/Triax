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
    return <p>Conecte sua carteira para sacar.</p>;
  }
  if (balance === null) {
    return <p>Carregando…</p>;
  }

  return (
    <div>
      <p>Saldo disponível: {balance}</p>
      <input
        type="number"
        aria-label="Valor do saque"
        placeholder="0.0"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button onClick={handleWithdraw} disabled={!canSubmit}>
        Sacar
      </button>

      {insufficient && <p>Saldo insuficiente.</p>}
      {status === 'withdrawing' && <p>Sacando…</p>}
      {status === 'success' && <p>Saque concluído com sucesso!</p>}
      {status === 'error' && <p>Erro: {error}</p>}
    </div>
  );
}
