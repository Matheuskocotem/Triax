'use client';

// Página da Iteration 1: liga ?manager= → ManagerCard, a wallet conectada →
// PortfolioPanel, e o ConnectWalletButton no header. Os componentes leem o
// contrato real (managerContract.ts) por conta própria.

import { useManagerAddress } from '@/hooks/useManagerAddress';
import { ManagerCard } from '@/components/manager/ManagerCard';
import { PortfolioPanel } from '@/components/portfolio/PortfolioPanel';
import { ConnectWalletButton } from '@/components/wallet/ConnectWalletButton';

export default function Home() {
  const manager = useManagerAddress();

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <header className="flex items-center justify-between border-b border-gray-800 px-6 py-4">
        <h1 className="text-xl font-bold tracking-tight">Triax</h1>
        <ConnectWalletButton />
      </header>

      <div className="mx-auto max-w-2xl space-y-8 px-6 py-10">
        <ManagerCard address={manager} />
        <PortfolioPanel />
      </div>
    </main>
  );
}
