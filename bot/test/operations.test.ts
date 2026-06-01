/**
 * GET /operations/:address — histórico de operações do bot (TRIAX-9).
 *
 * Fase TDD: RED. O endpoint ainda não existe → todos devem FALHAR.
 * Não sobe servidor (supertest) nem toca o Postgres real (pg mockado).
 * O JWT é emitido de verdade com o mesmo segredo do endpoint de sessão.
 */
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';

// MOCK do pg: a query é um jest.fn() compartilhado por toda instância de Pool.
jest.mock('pg', () => {
  const query = jest.fn();
  return { Pool: jest.fn(() => ({ query })) };
});

import app from '../src/app';

const mockQuery = new (Pool as unknown as jest.Mock)().query as jest.Mock;

const SECRET = process.env.JWT_SECRET ?? 'triax-dev-secret';
const ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

function authHeader(address = ADDRESS): string {
  return `Bearer ${jwt.sign({ sub: address }, SECRET, { expiresIn: '1h' })}`;
}

describe('GET /operations/:address', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Critério: retorna a lista de operações do Postgres para o endereço.
  it('retorna a lista de operações do endereço', async () => {
    mockQuery.mockResolvedValue({
      rows: [{ id: 1, date: '2026-05-30', pair: 'BTC/ETH', result: '+1.2%' }],
    });

    const res = await request(app)
      .get(`/operations/${ADDRESS}`)
      .set('Authorization', authHeader());

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.operations)).toBe(true);
    expect(res.body.operations).toHaveLength(1);
  });

  // Critério: retorna array vazio se não há operações.
  it('retorna array vazio quando não há operações', async () => {
    mockQuery.mockResolvedValue({ rows: [] });

    const res = await request(app)
      .get(`/operations/${ADDRESS}`)
      .set('Authorization', authHeader());

    expect(res.status).toBe(200);
    expect(res.body.operations).toEqual([]);
  });

  // Critério: retorna 401 se não há JWT válido no header.
  it('retorna 401 quando falta um JWT válido', async () => {
    const res = await request(app).get(`/operations/${ADDRESS}`);
    expect(res.status).toBe(401);
  });
});
