'use client';

// Exibe os dados do gestor lidos do contrato (TRIAX-5).
// Estados: ausente (neutro) -> inválido (erro) -> carregando -> carregado.

import React, { useEffect, useState } from 'react';

import { isValidEthereumAddress } from '@/lib/eth/address';
import { fetchManagerData, ManagerData } from '@/lib/contract/managerContract';

export interface ManagerCardProps {
  /** Endereço do gestor vindo de ?manager= (pode ser ausente ou inválido) */
  address?: string | null;
}

// Badge de status do gestor: verde (active), amarelo (paused), vermelho (closed).
const STATUS_BADGE: Record<string, string> = {
  active: 'bg-green-500/10 text-green-400 ring-green-500/30',
  paused: 'bg-yellow-500/10 text-yellow-400 ring-yellow-500/30',
  closed: 'bg-red-500/10 text-red-400 ring-red-500/30',
};

const MESSAGE_CLASS = 'rounded-xl border border-gray-800 bg-gray-900/60 px-6 py-5 text-gray-400';

export function ManagerCard({ address }: ManagerCardProps): JSX.Element {
  const valid = isValidEthereumAddress(address);
  const [data, setData] = useState<ManagerData | null>(null);

  useEffect(() => {
    if (!valid || !address) return;
    let active = true;
    fetchManagerData(address).then((result) => {
      if (active) setData(result);
    });
    return () => {
      active = false;
    };
  }, [address, valid]);

  // Estado neutro: nenhum gestor informado na URL.
  if (!address) {
    return <div role="status" className={MESSAGE_CLASS}>Nenhum gestor informado.</div>;
  }

  // Erro: endereço presente mas fora do formato 0x + 40 hex.
  if (!valid) {
    return <div role="alert" className={`${MESSAGE_CLASS} text-red-400`}>Endereço de gestor inválido.</div>;
  }

  // Aguardando a leitura on-chain.
  if (!data) {
    return <div role="status" className={MESSAGE_CLASS}>Carregando gestor…</div>;
  }

  return (
    <article className="rounded-xl border border-gray-800 bg-gray-900/60 p-6 shadow-lg shadow-black/20">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">{data.name}</h2>
          <p className="mt-1 text-sm text-gray-400">{data.strategy}</p>
        </div>
        <span
          className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide ring-1 ring-inset ${
            STATUS_BADGE[data.status] ?? STATUS_BADGE.active
          }`}
        >
          {data.status}
        </span>
      </div>

      <div className="mt-5">
        <p className="text-xs uppercase tracking-wide text-gray-500">APY estimado</p>
        <p className="text-2xl font-bold text-green-400">{data.apy}%</p>
      </div>
    </article>
  );
}
