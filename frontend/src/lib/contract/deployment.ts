// Resolve o manifest de deploy do Triax (endereço + ABI + seed).
//
// O manifest REAL (triax.deployment.json) é gerado por
// contracts/scripts/deploy.ts e fica no .gitignore (varia por ambiente).
// Para que type-check/build não dependam dele, caímos no manifest de EXEMPLO
// (triax.deployment.example.json, versionado, com endereço/seed placeholder e
// o ABI real) quando o real não existe.

import example from './triax.deployment.example.json';

export type Deployment = typeof example;

function loadDeployment(): Deployment {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('./triax.deployment.json') as Deployment;
  } catch {
    return example;
  }
}

export const deployment: Deployment = loadDeployment();
