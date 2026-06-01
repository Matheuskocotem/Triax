/**
 * lib/contract/deposit.ts — fluxo de depósito ERC-20 (approve + deposit) — TRIAX-8.
 *
 * Fase TDD: RED. Os stubs lançam "Not implemented" → todos devem FALHAR.
 * Mocka APENAS a borda de escrita do wagmi (wagmi/actions). Não toca a rede.
 */
import { approveToken, depositFunds } from '@/lib/contract/deposit';

// MOCK do wagmi: writeContract + waitForTransactionReceipt.
jest.mock('wagmi/actions', () => ({
  writeContract: jest.fn(),
  waitForTransactionReceipt: jest.fn(),
}));
import { writeContract, waitForTransactionReceipt } from 'wagmi/actions';

// MOCK da config do wagmi: evita carregar o wagmi real (ESM) e fornece um
// objeto de config truthy (basta ser passado adiante ao writeContract).
jest.mock('@/lib/wallet/config', () => ({ config: { __mock: 'config' } }));

const wc = writeContract as jest.Mock;
const wait = waitForTransactionReceipt as jest.Mock;

const AMOUNT = BigInt('100000000000000000000'); // 100 * 1e18
const MANAGER = '0xabcdef0123456789abcdef0123456789abcdef01' as const;

describe('lib/contract/deposit — approve + deposit (TRIAX-8)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    wc.mockResolvedValue('0xhash');
    wait.mockResolvedValue({ status: 'success' });
  });

  // approveToken chama approve no contrato do token.
  it('approveToken chama approve no contrato do token', async () => {
    await approveToken(AMOUNT);
    expect(wc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ functionName: 'approve' }),
    );
  });

  // depositFunds chama deposit no Triax.
  it('depositFunds chama deposit no Triax', async () => {
    await depositFunds(AMOUNT, MANAGER);
    expect(wc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ functionName: 'deposit' }),
    );
  });

  // Fluxo completo: approve antes do deposit.
  it('fluxo completo executa approve e depois deposit', async () => {
    await approveToken(AMOUNT);
    await depositFunds(AMOUNT, MANAGER);

    const fns = wc.mock.calls.map((call) => call[1].functionName);
    expect(fns).toEqual(['approve', 'deposit']);
  });

  // Rejeição do usuário na wallet é propagada como erro.
  it('propaga o erro quando o usuário rejeita na wallet', async () => {
    wc.mockRejectedValueOnce(new Error('User rejected the request'));
    await expect(approveToken(AMOUNT)).rejects.toThrow(/reject|rejei|recus|cancel/i);
  });
});
