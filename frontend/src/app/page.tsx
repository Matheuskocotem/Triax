'use client';

// Liga todos os componentes da dashboard: ?manager= → ManagerCard (sempre),
// a wallet conectada → depósito/saque/rendimento, e — quando o endereço é
// gestor — o agregado e a configuração da estratégia (ManagerPanel/StrategyForm
// se auto-gateiam pela leitura on-chain). O header carrega o ConnectWalletButton.

import { useAccount } from 'wagmi';

import { useManagerAddress } from '@/hooks/useManagerAddress';
import { ManagerCard } from '@/components/manager/ManagerCard';
import { PortfolioPanel } from '@/components/portfolio/PortfolioPanel';
import { ConnectWalletButton } from '@/components/wallet/ConnectWalletButton';
import { DepositForm } from '@/components/deposit/DepositForm';
import { WithdrawForm } from '@/components/dashboard/WithdrawForm';
import { YieldPanel } from '@/components/dashboard/YieldPanel';
import { ManagerPanel } from '@/components/dashboard/ManagerPanel';
import { StrategyForm } from '@/components/dashboard/StrategyForm';

export default function Home() {
  const manager = useManagerAddress();
  const { isConnected } = useAccount();

  return (
    <main className="min-h-screen bg-gray-950 font-sans text-white antialiased">
      <header className="flex items-center justify-between border-b border-gray-800 px-6 py-4">
        <h1 className="text-2xl font-bold tracking-tight text-violet-500">Triax</h1>
        <ConnectWalletButton />
      </header>

      <div className="mx-auto max-w-2xl space-y-8 px-6 py-10">
        <ManagerCard address={manager} />

        {isConnected && (
          <>
            <PortfolioPanel />
            <DepositForm />
            <WithdrawForm />
            <YieldPanel />

            {/* Só rendem conteúdo quando o endereço conectado é um gestor
                registrado (auto-gate via leitura on-chain). */}
            <ManagerPanel />
            <StrategyForm />
          </>
        )}
      </div>
    </main>
  );
}
