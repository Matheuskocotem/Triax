/**
 * lib/auth/session.ts — sessão EIP-712 + JWT (TRIAX-6).
 *
 * Fase TDD: RED. Os stubs lançam "Not implemented" → todos devem FALHAR.
 * O backend é MOCKADO (mock do fetch); a assinatura EIP-712 entra como string
 * pronta (a geração/validação real da assinatura é testada no bot).
 */
import { createSession, getSession, clearSession } from '@/lib/auth/session';

const ADDRESS = '0x1234567890abcdef1234567890abcdef12345678';
const SIGNATURE = '0xdeadbeefsignature';

function mockFetchOnce(body: unknown, status: number) {
  return jest.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}

describe('lib/auth/session — EIP-712 + JWT', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.restoreAllMocks();
  });

  // createSession: assinatura válida → chama o backend e retorna o JWT.
  it('createSession chama o backend e retorna o JWT', async () => {
    const fetchMock = mockFetchOnce({ token: 'jwt-abc' }, 200);

    const session = await createSession(ADDRESS, SIGNATURE);

    expect(fetchMock).toHaveBeenCalled();
    expect(session.token).toBe('jwt-abc');
    expect(session.address).toBe(ADDRESS);
  });

  // createSession: assinatura inválida (backend responde 401) → rejeita.
  it('createSession rejeita quando a assinatura é inválida', async () => {
    mockFetchOnce({ error: 'invalid signature' }, 401);

    await expect(createSession(ADDRESS, '0xbad')).rejects.toThrow(
      /inválid|invalid|autoriz|401/i,
    );
  });

  // getSession: retorna o JWT armazenado, se existir.
  it('getSession retorna o JWT armazenado', async () => {
    mockFetchOnce({ token: 'jwt-stored' }, 200);
    await createSession(ADDRESS, SIGNATURE);

    expect(getSession()).toBe('jwt-stored');
  });

  // clearSession: remove o JWT armazenado.
  it('clearSession remove o JWT', async () => {
    mockFetchOnce({ token: 'jwt-x' }, 200);
    await createSession(ADDRESS, SIGNATURE);

    clearSession();

    expect(getSession()).toBeNull();
  });
});
