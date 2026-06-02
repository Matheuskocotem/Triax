// Fluxo de depósito ERC-20 (approve + deposit) — TRIAX-8.
// Escreve on-chain via wagmi (writeContract) usando a wallet conectada.

import { writeContract, waitForTransactionReceipt } from 'wagmi/actions';
import type { Abi } from 'viem';

import { config } from '@/lib/wallet/config';
import { deployment } from './deployment';

// ABI mínimo do ERC-20 para o approve.
const ERC20_ABI = [
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
  },
] as const;

const TRIAX = deployment.address as `0x${string}`;
const TOKEN = deployment.token as `0x${string}`;

// Aprova o Triax a gastar `amount` do token do usuário.
export async function approveToken(amount: bigint): Promise<`0x${string}`> {
  const hash = await writeContract(config, {
    address: TOKEN,
    abi: ERC20_ABI,
    functionName: 'approve',
    args: [TRIAX, amount],
  });
  await waitForTransactionReceipt(config, { hash });
  return hash;
}

// Deposita `amount` no Triax, vinculando o investidor ao `manager`
// (exige approve prévio).
export async function depositFunds(amount: bigint, manager: `0x${string}`): Promise<`0x${string}`> {
  const hash = await writeContract(config, {
    address: TRIAX,
    abi: deployment.abi as Abi,
    functionName: 'deposit',
    args: [amount, manager],
  });
  await waitForTransactionReceipt(config, { hash });
  return hash;
}

// TRIAX-11 — saca `amount` do Triax de volta para o usuário.
export async function withdrawFunds(amount: bigint): Promise<`0x${string}`> {
  const hash = await writeContract(config, {
    address: TRIAX,
    abi: deployment.abi as Abi,
    functionName: 'withdraw',
    args: [amount],
  });
  await waitForTransactionReceipt(config, { hash });
  return hash;
}
