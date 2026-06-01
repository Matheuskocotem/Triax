// Camada de leitura on-chain do Triax (TRIAX-5 e TRIAX-7).
// Lê fatos brutos do contrato via viem; valores derivados (APY) são calculados
// aqui no frontend, não no contrato.

import {
  createPublicClient,
  http,
  defineChain,
  formatEther,
  BaseError,
  ContractFunctionRevertedError,
  type Abi,
} from 'viem';

import { deployment } from './deployment';

export type ManagerStatus = 'active' | 'paused' | 'closed';

export interface ManagerData {
  address: string;
  name: string;
  strategy: string;
  /** APY em pontos percentuais, ex: 12.5 = 12,5%. Derivado (ver deriveApy). */
  apy: number;
  status: ManagerStatus;
}

// TRIAX-10 — agregado do gestor (total sob gestão, investidores, comissão).
export interface ManagerStats {
  /** Total depositado sob gestão (formatado) */
  totalDeposited: string;
  investorCount: number;
  /** Comissão acumulada (formatada) */
  commissionAccrued: string;
}

export type PortfolioStatus = 'active' | 'empty' | 'paused';

export interface Position {
  asset: string;
  /** Quantidade já formatada para exibição */
  amount: string;
}

export interface PortfolioData {
  /** Saldo custodiado no contrato (formatado em ETH) */
  balance: string;
  /** Rendimento acumulado (formatado em ETH) */
  yield: string;
  status: PortfolioStatus;
  positions: Position[];
}

const SECONDS_PER_YEAR = 31_536_000; // 365 dias

const chain = defineChain({
  id: deployment.chainId,
  name: 'triax-local',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: [deployment.rpcUrl] } },
});

const client = createPublicClient({ chain, transport: http(deployment.rpcUrl) });

const contract = {
  address: deployment.address as `0x${string}`,
  abi: deployment.abi as Abi,
} as const;

// Tuplas brutas devolvidas pelo contrato (viem decodifica uint→bigint, enum→number).
type RawManager = readonly [string, string, number];
type RawPosition = readonly [bigint, bigint, boolean, bigint];

function mapManagerStatus(raw: number): ManagerStatus {
  switch (Number(raw)) {
    case 1:
      return 'paused';
    case 2:
      return 'closed';
    default:
      return 'active';
  }
}

/**
 * APY DERIVADO (não existe no contrato — só fatos brutos ficam on-chain).
 * Anualiza o rendimento realizado da posição desde o depósito:
 *
 *   APY% = (yield / balance) * (SECONDS_PER_YEAR / elapsed) * 100
 *
 * onde elapsed = (agora - depositedAt) em segundos. Retorna 0 quando não há
 * saldo ou tempo decorrido (evita divisão por zero).
 */
function deriveApy(balance: bigint, yieldAmount: bigint, depositedAt: bigint, nowSeconds: number): number {
  if (balance === BigInt(0) || depositedAt === BigInt(0)) return 0;
  const elapsed = nowSeconds - Number(depositedAt);
  if (elapsed <= 0) return 0;
  const ratio = Number(yieldAmount) / Number(balance);
  return ratio * (SECONDS_PER_YEAR / elapsed) * 100;
}

// TRIAX-5: lê os dados do gestor; reverte (ManagerNotFound) → erro "não encontrado".
export async function fetchManagerData(address: string): Promise<ManagerData> {
  const account = address as `0x${string}`;
  try {
    const [name, strategy, status] = (await client.readContract({
      ...contract,
      functionName: 'getManager',
      args: [account],
    })) as RawManager;

    const [balance, yieldAmount, , depositedAt] = (await client.readContract({
      ...contract,
      functionName: 'getPosition',
      args: [account],
    })) as RawPosition;

    const nowSeconds = Math.floor(Date.now() / 1000);

    return {
      address,
      name,
      strategy,
      status: mapManagerStatus(status),
      apy: deriveApy(balance, yieldAmount, depositedAt, nowSeconds),
    };
  } catch (err) {
    // getManager reverte com ManagerNotFound quando o gestor não existe.
    if (err instanceof BaseError) {
      const revert = err.walk((e) => e instanceof ContractFunctionRevertedError);
      if (revert instanceof ContractFunctionRevertedError) {
        throw new Error(`Gestor não encontrado on-chain: ${address}`);
      }
    }
    throw err;
  }
}

// TRIAX-7: lê saldo e posição do investidor; converte wei→ETH.
export async function fetchPortfolio(address: string): Promise<PortfolioData> {
  const [balance, yieldAmount, active] = (await client.readContract({
    ...contract,
    functionName: 'getPosition',
    args: [address as `0x${string}`],
  })) as RawPosition;

  return {
    balance: formatEther(balance),
    yield: formatEther(yieldAmount),
    status: active ? 'active' : 'empty',
    positions: active ? [{ asset: 'ETH', amount: formatEther(balance) }] : [],
  };
}

// TRIAX-10 — agregado do gestor; rejeita "não é gestor" quando o contrato reverte.
export async function fetchManagerStats(address: string): Promise<ManagerStats> {
  try {
    const [totalDeposited, investorCount, commissionAccrued] = (await client.readContract({
      ...contract,
      functionName: 'getManagerStats',
      args: [address as `0x${string}`],
    })) as readonly [bigint, bigint, bigint];

    return {
      totalDeposited: formatEther(totalDeposited),
      investorCount: Number(investorCount),
      commissionAccrued: formatEther(commissionAccrued),
    };
  } catch (err) {
    if (err instanceof BaseError) {
      const revert = err.walk((e) => e instanceof ContractFunctionRevertedError);
      if (revert instanceof ContractFunctionRevertedError) {
        throw new Error(`Endereço não é um gestor registrado: ${address}`);
      }
    }
    throw err;
  }
}
