// API HTTP do bot/backend — autenticação por assinatura EIP-712 + JWT (TRIAX-6).

import express from 'express';
import jwt from 'jsonwebtoken';
import { verifyTypedData } from 'ethers';

const app = express();
app.use(express.json());

// Mesmo domínio/tipos assinados pelo ConnectWalletButton no frontend.
const SESSION_DOMAIN = { name: 'Triax', version: '1' };
const SESSION_TYPES = {
  Session: [
    { name: 'action', type: 'string' },
    { name: 'address', type: 'address' },
  ],
};

// POST /auth/session — recebe { address, signature } e devolve um JWT se a
// assinatura EIP-712 corresponder ao endereço alegado.
app.post('/auth/session', (req, res) => {
  const { address, signature } = req.body ?? {};
  if (!address || !signature) {
    return res.status(400).json({ error: 'address and signature are required' });
  }

  let recovered: string;
  try {
    recovered = verifyTypedData(
      SESSION_DOMAIN,
      SESSION_TYPES,
      { action: 'sign-in', address },
      signature,
    );
  } catch {
    return res.status(401).json({ error: 'invalid signature' });
  }

  if (recovered.toLowerCase() !== String(address).toLowerCase()) {
    return res.status(401).json({ error: 'signature does not match address' });
  }

  const secret = process.env.JWT_SECRET ?? 'triax-dev-secret';
  const token = jwt.sign({ sub: address }, secret, { expiresIn: '1h' });
  return res.status(200).json({ token, address });
});

export default app;
