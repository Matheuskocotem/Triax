// STUB (fase RED do TDD) — camada de leitura do smart contract.
// Em produção fará leituras on-chain (wagmi/viem). Nos testes é SEMPRE MOCKADA
// (jest.mock), nunca toca a blockchain de verdade.
// Implementação real virá nas fases GREEN de TRIAX-5 e TRIAX-7.

export type ManagerStatus = 'active' | 'paused' | 'closed';

export interface ManagerData {
  address: string;
  name: string;
  strategy: string;
  /** APY em pontos percentuais, ex: 12.5 = 12,5% */
  apy: number;
  status: ManagerStatus;
}

export type PortfolioStatus = 'active' | 'empty' | 'paused';

export interface Position {
  asset: string;
  /** Quantidade já formatada para exibição */
  amount: string;
}

export interface PortfolioData {
  /** Saldo custodiado no contrato (formatado) */
  balance: string;
  /** Rendimento acumulado (formatado) */
  yield: string;
  status: PortfolioStatus;
  positions: Position[];
}

// TRIAX-5: lê os dados do gestor no contrato.
export async function fetchManagerData(_address: string): Promise<ManagerData> {
  throw new Error('Not implemented');
}

// TRIAX-7: lê saldo e posições do investidor conectado.
export async function fetchPortfolio(_address: string): Promise<PortfolioData> {
  throw new Error('Not implemented');
}
