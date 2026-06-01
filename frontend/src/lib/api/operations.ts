// Histórico de operações do bot (TRIAX-9). Busca no backend com o JWT da sessão.

export interface Operation {
  id: number | string;
  date: string;
  pair: string;
  result: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export async function fetchOperations(address: string, token: string): Promise<Operation[]> {
  const res = await fetch(`${API_URL}/operations/${address}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`Falha ao buscar operações (HTTP ${res.status})`);
  }

  const { operations } = (await res.json()) as { operations: Operation[] };
  return operations;
}
