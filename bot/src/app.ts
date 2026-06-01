// API HTTP do bot/backend — autenticação por assinatura EIP-712 + JWT (TRIAX-6).

import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { verifyTypedData } from 'ethers';
import { Pool } from 'pg';

const app = express();
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET ?? 'triax-dev-secret';

// Pool real do Postgres (lazy — só conecta na 1ª query). Mockado nos testes.
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Mesmo domínio/tipos assinados pelo ConnectWalletButton no frontend.
const SESSION_DOMAIN = { name: 'Triax', version: '1' };
const SESSION_TYPES = {
  Session: [
    { name: 'action', type: 'string' },
    { name: 'address', type: 'address' },
  ],
};

// Verifica o JWT do header Authorization (Bearer). Responde 401 e retorna
// false quando ausente/inválido.
function requireAuth(req: Request, res: Response): boolean {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;
  if (!token) {
    res.status(401).json({ error: 'missing token' });
    return false;
  }
  try {
    jwt.verify(token, JWT_SECRET);
    return true;
  } catch {
    res.status(401).json({ error: 'invalid token' });
    return false;
  }
}

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

  const token = jwt.sign({ sub: address }, JWT_SECRET, { expiresIn: '1h' });
  return res.status(200).json({ token, address });
});

// GET /operations/:address — histórico de operações do bot (TRIAX-9).
// Requer JWT válido. Retorna { operations: [...] } (vazio se não houver).
app.get('/operations/:address', async (req, res) => {
  if (!requireAuth(req, res)) return;

  const result = await pool.query(
    'SELECT * FROM operations WHERE address = $1 ORDER BY created_at DESC',
    [req.params.address],
  );
  return res.status(200).json({ operations: result.rows });
});

export default app;
