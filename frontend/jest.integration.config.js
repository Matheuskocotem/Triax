const nextJest = require('next/jest');

const createJestConfig = nextJest({ dir: './' });

// Testes de integração: leem o contrato Triax na rede Hardhat local.
// Pré-requisitos: `hardhat node` rodando + `deploy.ts` executado (gera o
// manifest src/lib/contract/triax.deployment.json). Ambiente Node (sem jsdom).
/** @type {import('jest').Config} */
const integrationConfig = {
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['<rootDir>/src/__tests__/integration/**/*.test.{ts,tsx}'],
  testTimeout: 30000,
};

module.exports = createJestConfig(integrationConfig);
