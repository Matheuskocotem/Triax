'use client';

// Lê o parâmetro ?manager= da URL (TRIAX-5). Retorna o endereço bruto
// (string) ou null quando ausente. A validação fica a cargo de quem consome.

import { useSearchParams } from 'next/navigation';

export function useManagerAddress(): string | null {
  const params = useSearchParams();
  return params.get('manager');
}
