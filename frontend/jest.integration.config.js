const nextJest = require('next/jest');

const createJestConfig = nextJest({ dir: './' });

// Testes de integração: leem o contrato Triax na rede Hardhat local.
// Pré-requisitos: `hardhat node` rodando + `deploy.ts` executado (gera o
// manifest src/lib/contract/triax.deployment.json).
// Environment: jsdom + globais de rede do Node (ver jest.integration.env.js),
// para que testes de página (React) usem o reader real (viem) contra a rede.
/** @type {import('jest').Config} */
const integrationConfig = {
  testEnvironment: '<rootDir>/jest.integration.env.js',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['<rootDir>/src/__tests__/integration/**/*.test.{ts,tsx}'],
  testTimeout: 30000,
  // As suítes de integração compartilham um único node Hardhat — rodar em
  // série evita contenção/flakiness entre os workers.
  maxWorkers: 1,
};

module.exports = createJestConfig(integrationConfig);
