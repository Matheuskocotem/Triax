// Config do wagmi compartilhada (providers do app + ações de escrita em deposit.ts).

import { createConfig, http } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { defineChain } from 'viem';

import { deployment } from '@/lib/contract/deployment';

export const triaxChain = defineChain({
  id: deployment.chainId,
  name: 'Triax Local',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: [deployment.rpcUrl] } },
});

export const config = createConfig({
  chains: [triaxChain],
  connectors: [injected()],
  transports: { [triaxChain.id]: http(deployment.rpcUrl) },
  ssr: true,
});
