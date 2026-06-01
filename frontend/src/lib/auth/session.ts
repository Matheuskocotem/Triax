// Sessão via assinatura EIP-712 + JWT (TRIAX-6).
// O JWT é emitido pelo backend (bot) e guardado no localStorage.

export interface Session {
  token: string;
  address: string;
}

const STORAGE_KEY = 'triax.session.jwt';
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

// Envia endereço + assinatura ao backend; guarda o JWT e o devolve.
export async function createSession(address: string, signature: string): Promise<Session> {
  const res = await fetch(`${API_URL}/auth/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, signature }),
  });

  if (!res.ok) {
    throw new Error(`Sessão inválida: assinatura recusada (HTTP ${res.status})`);
  }

  const { token } = (await res.json()) as { token: string };
  localStorage.setItem(STORAGE_KEY, token);
  return { token, address };
}

// Retorna o JWT armazenado, ou null.
export function getSession(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

// Remove o JWT armazenado.
export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEY);
}
