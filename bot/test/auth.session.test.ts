/**
 * POST /auth/session — autenticação por assinatura EIP-712 + JWT (TRIAX-6).
 *
 * Fase TDD: RED. O endpoint é um stub que responde 501 → todos devem FALHAR.
 * Não sobe servidor real: usa supertest sobre o app express. As assinaturas
 * EIP-712 são geradas de verdade com ethers (contas de teste do Hardhat).
 */
import request from 'supertest';
import { Wallet } from 'ethers';

import app from '../src/app';

// Conta #0 do Hardhat (chave determinística, só para teste).
const PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

// Mesmo domínio/tipos usados pelo ConnectWalletButton no frontend.
const domain = { name: 'Triax', version: '1' };
const types = {
  Session: [
    { name: 'action', type: 'string' },
    { name: 'address', type: 'address' },
  ],
};

async function signSession(wallet: Wallet): Promise<string> {
  return wallet.signTypedData(domain, types, { action: 'sign-in', address: wallet.address });
}

describe('POST /auth/session', () => {
  // Critério: assinatura cujo signer recuperado bate com o endereço → 200 + JWT.
  it('retorna um JWT quando a assinatura corresponde ao endereço', async () => {
    const wallet = new Wallet(PRIVATE_KEY);
    const signature = await signSession(wallet);

    const res = await request(app)
      .post('/auth/session')
      .send({ address: wallet.address, signature });

    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe('string');
    expect(res.body.token.length).toBeGreaterThan(0);
  });

  // Critério: assinatura que NÃO corresponde ao endereço alegado → 401.
  it('retorna 401 quando a assinatura não corresponde ao endereço', async () => {
    const signer = new Wallet(PRIVATE_KEY);
    const signature = await signSession(signer);
    const claimedAddress = '0x000000000000000000000000000000000000dEaD';

    const res = await request(app)
      .post('/auth/session')
      .send({ address: claimedAddress, signature });

    expect(res.status).toBe(401);
  });
});
