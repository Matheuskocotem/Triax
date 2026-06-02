/**
 * ConnectWalletButton — teste visual/design (Tailwind). Dia de design.
 * Fase RED: sem classes → FALHA. Exige botão pill com borda roxa.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('wagmi', () => ({
  useAccount: () => ({ isConnected: false }),
  useConnect: () => ({ connect: jest.fn(), connectors: [{ id: 'mock', name: 'Mock' }] }),
  useDisconnect: () => ({ disconnect: jest.fn() }),
  useSignTypedData: () => ({ signTypedDataAsync: jest.fn() }),
}));
import { ConnectWalletButton } from '@/components/wallet/ConnectWalletButton';

describe('ConnectWalletButton — visual/design (Tailwind)', () => {
  it('é um botão pill com borda/accent roxo', () => {
    render(<ConnectWalletButton />);
    const btn = screen.getByRole('button', { name: /connect wallet/i });

    expect(btn.className).toMatch(/rounded-full/);
    expect(btn.className).toMatch(/violet/);
  });
});
