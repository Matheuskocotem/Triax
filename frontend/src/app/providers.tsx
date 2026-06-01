'use client';

// Providers de runtime do app (NÃO exercitados pelos testes, que mockam wagmi).
// Mínimo para a página funcionar no navegador contra a rede Hardhat local.

import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { config } from '@/lib/wallet/config';

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
