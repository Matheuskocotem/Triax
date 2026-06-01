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
    return <div role="status">Nenhum gestor informado.</div>;
  }

  // Erro: endereço presente mas fora do formato 0x + 40 hex.
  if (!valid) {
    return <div role="alert">Endereço de gestor inválido.</div>;
  }

  // Aguardando a leitura on-chain.
  if (!data) {
    return <div role="status">Carregando gestor…</div>;
  }

  return (
    <article>
      <h2>{data.name}</h2>
      <p>{data.strategy}</p>
      <p>{data.apy}%</p>
      <p>{data.status}</p>
    </article>
  );
}
