const nextJest = require('next/jest');

const createJestConfig = nextJest({ dir: './' });

/** @type {import('jest').Config} */
const customJestConfig = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['<rootDir>/src/**/__tests__/**/*.test.{ts,tsx}'],
  // Integração roda em config própria (jest.integration.config.js): precisa de
  // rede Hardhat + manifest, então fica fora da suíte unitária.
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/src/__tests__/integration/'],
};

module.exports = createJestConfig(customJestConfig);
