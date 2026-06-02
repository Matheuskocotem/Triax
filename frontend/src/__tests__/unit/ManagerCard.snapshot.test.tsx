/**
 * ManagerCard — teste visual/design (Tailwind). Dia de design.
 *
 * Fase RED: o componente ainda é texto cru → as asserções de classe FALHAM.
 * Não muda lógica nenhuma; só exige os tokens de design (card, badge, accents).
 */
import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('@/lib/contract/managerContract', () => ({ fetchManagerData: jest.fn() }));
import { fetchManagerData } from '@/lib/contract/managerContract';
import { ManagerCard } from '@/components/manager/ManagerCard';

const mockFetch = fetchManagerData as jest.Mock;
const MANAGER = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';

describe('ManagerCard — visual/design (Tailwind)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockResolvedValue({
      address: MANAGER,
      name: 'Mesa Alpha',
      strategy: 'Triangulação BTC/ETH/USDT',
      apy: 12.5,
      status: 'active',
    });
  });

  it('renderiza um card com borda arredondada e contorno sutil', async () => {
    const { container } = render(<ManagerCard address={MANAGER} />);
    await screen.findByText('Mesa Alpha');

    const card = container.firstChild as HTMLElement; // <article>
    expect(card.className).toMatch(/rounded-xl/);
    expect(card.className).toMatch(/border/);
  });

  it('mostra o APY em verde e o status como badge (pill)', async () => {
    render(<ManagerCard address={MANAGER} />);
    await screen.findByText('Mesa Alpha');

    expect(screen.getByText('12.5%').className).toMatch(/text-green-400/);

    const badge = screen.getByText('active');
    expect(badge.className).toMatch(/rounded-full/);
    expect(badge.className).toMatch(/green/);
  });
});
