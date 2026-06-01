'use client';

// Providers de runtime do app (NÃO exercitados pelos testes, que mockam wagmi).
// Mínimo para a página funcionar no navegador contra a rede Hardhat local.

import { WagmiProvider, createConfig, http } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { injected } from 'wagmi/connectors';
import { defineChain } from 'viem';

const triaxLocal = defineChain({
  id: 31337,
  name: 'Triax Local',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['http://127.0.0.1:8545'] } },
});

const config = createConfig({
  chains: [triaxLocal],
  connectors: [injected()],
  transports: { [triaxLocal.id]: http('http://127.0.0.1:8545') },
  ssr: true,
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
