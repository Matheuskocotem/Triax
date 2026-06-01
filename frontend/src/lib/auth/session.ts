// STUB (fase RED do TDD) — sessão via assinatura EIP-712.
// Nos testes o backend é MOCKADO (jest.mock); aqui nada é implementado de verdade.
// Implementação real virá na fase GREEN da história TRIAX-6.

export interface Session {
  token: string;
  address: string;
}

// Cria a sessão no backend a partir do endereço + assinatura EIP-712.
export async function createSession(_address: string, _signature: string): Promise<Session> {
  throw new Error('Not implemented');
}
