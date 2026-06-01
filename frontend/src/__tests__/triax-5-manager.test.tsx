/**
 * TRIAX-5 — Acessar link com ?manager= e ver dados do gestor
 *
 * Fase TDD: RED. Apenas testes; a implementação é um stub que lança
 * "Not implemented". Toda dependência externa (smart contract) é MOCKADA —
 * nenhuma chamada on-chain real acontece aqui.
 *
 * Espera-se que TODOS os testes deste arquivo FALHEM nesta fase.
 */
import React from 'react';
import { render, screen, waitFor, renderHook } from '@testing-library/react';

import { isValidEthereumAddress } from '@/lib/eth/address';
import { useManagerAddress } from '@/hooks/useManagerAddress';
import { ManagerCard } from '@/components/manager/ManagerCard';
import * as managerContract from '@/lib/contract/managerContract';

// MOCK do smart contract — substitui as leituras on-chain por jest.fn().
jest.mock('@/lib/contract/managerContract');
const mockedContract = managerContract as jest.Mocked<typeof managerContract>;

// MOCK do roteador do Next — controlamos a query string nos testes.
jest.mock('next/navigation', () => ({
  useSearchParams: jest.fn(),
}));
import { useSearchParams } from 'next/navigation';
const mockedUseSearchParams = useSearchParams as jest.Mock;

const VALID = '0x1234567890abcdef1234567890ABCDEF12345678';
const INVALID = '0x123';

describe('TRIAX-5 — dados do gestor via ?manager=', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Critério de aceitação: lê o parâmetro `manager` da URL.
  describe('leitura do parâmetro manager na URL', () => {
    it('lê o endereço presente em ?manager= da query string', () => {
      mockedUseSearchParams.mockReturnValue(new URLSearchParams(`manager=${VALID}`));
      const { result } = renderHook(() => useManagerAddress());
      expect(result.current).toBe(VALID);
    });

    it('retorna null quando o parâmetro manager está ausente', () => {
      mockedUseSearchParams.mockReturnValue(new URLSearchParams(''));
      const { result } = renderHook(() => useManagerAddress());
      expect(result.current).toBeNull();
    });
  });

  // Critério de aceitação: valida endereço Ethereum (0x + 40 hex) — caso VÁLIDO.
  describe('validação de endereço Ethereum', () => {
    it('aceita um endereço com 0x + 40 caracteres hexadecimais', () => {
      expect(isValidEthereumAddress(VALID)).toBe(true);
    });

    // Critério de aceitação: valida endereço Ethereum — caso INVÁLIDO.
    it('rejeita endereços fora do padrão 0x + 40 hex', () => {
      expect(isValidEthereumAddress(INVALID)).toBe(false);
      expect(isValidEthereumAddress('nao-e-um-endereco')).toBe(false);
      expect(isValidEthereumAddress(`0x${'Z'.repeat(40)}`)).toBe(false);
      expect(isValidEthereumAddress(`0x${'a'.repeat(39)}`)).toBe(false);
    });

    it('rejeita valores ausentes (null, undefined ou vazio)', () => {
      expect(isValidEthereumAddress(null)).toBe(false);
      expect(isValidEthereumAddress(undefined)).toBe(false);
      expect(isValidEthereumAddress('')).toBe(false);
    });
  });

  // Critério de aceitação: busca dados do gestor no contrato (MOCK) e
  // renderiza nome, estratégia, APY e status.
  describe('renderização dos dados do gestor', () => {
    it('busca no contrato e renderiza nome, estratégia, APY e status', async () => {
      mockedContract.fetchManagerData.mockResolvedValue({
        address: VALID,
        name: 'Mesa Alpha',
        strategy: 'Triangulação BTC/ETH/USDT',
        apy: 12.5,
        status: 'active',
      });

      render(<ManagerCard address={VALID} />);

      // leu o contrato com o endereço correto
      await waitFor(() => {
        expect(mockedContract.fetchManagerData).toHaveBeenCalledWith(VALID);
      });

      // exibiu cada campo
      expect(await screen.findByText('Mesa Alpha')).toBeInTheDocument();
      expect(screen.getByText(/Triangulação BTC\/ETH\/USDT/)).toBeInTheDocument();
      expect(screen.getByText(/12[.,]5\s*%/)).toBeInTheDocument();
      expect(screen.getByText(/active/i)).toBeInTheDocument();
    });
  });

  // Critério de aceitação: exibe erro se o manager for inválido.
  it('exibe mensagem de erro quando o endereço do gestor é inválido', () => {
    render(<ManagerCard address={INVALID} />);
    expect(screen.getByText(/inválido/i)).toBeInTheDocument();
    // não deve tentar ler o contrato com um endereço inválido
    expect(mockedContract.fetchManagerData).not.toHaveBeenCalled();
  });

  // Critério de aceitação: exibe estado neutro se o manager estiver ausente.
  it('exibe estado neutro quando o parâmetro manager está ausente', () => {
    render(<ManagerCard address={null} />);
    expect(screen.getByText(/nenhum gestor|informe um gestor|sem gestor/i)).toBeInTheDocument();
    expect(mockedContract.fetchManagerData).not.toHaveBeenCalled();
  });
});
