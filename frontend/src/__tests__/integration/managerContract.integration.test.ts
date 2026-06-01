/**
 * Integração: lib/contract/managerContract.ts <-> Triax.sol (rede Hardhat local).
 *
 * Fase TDD: RED. A camada de leitura ainda é um stub que lança "Not implemented";
 * espera-se que TODOS estes testes FALHEM até a leitura on-chain real ser escrita.
 *
 * Pré-requisitos (para o futuro GREEN passar):
 *   1. cd contracts && npx hardhat node            # rede local em 127.0.0.1:8545
 *   2. npx hardhat run scripts/deploy.ts --network localhost
 *      -> faz deploy, semeia gestor + posição e gera triax.deployment.json
 *
 * Aqui NÃO mockamos o contrato: a leitura deve bater no contrato real semeado.
 */
import { fetchManagerData, fetchPortfolio } from '@/lib/contract/managerContract';
import { deployment as manifest } from '@/lib/contract/deployment';

describe('integração managerContract <-> Triax.sol (Hardhat local)', () => {
  // TRIAX-5: fetchManagerData lê um gestor real registrado no contrato.
  it('fetchManagerData lê o gestor registrado on-chain', async () => {
    const data = await fetchManagerData(manifest.seed.manager);

    expect(data.address.toLowerCase()).toBe(manifest.seed.manager.toLowerCase());
    expect(data.name).toBe(manifest.seed.managerData.name);
    expect(data.strategy).toBe(manifest.seed.managerData.strategy);
    expect(data.status).toBe('active'); // enum 0 (Active) -> 'active'
  });

  // TRIAX-7: fetchPortfolio lê a posição real após um depósito + rendimento.
  it('fetchPortfolio lê a posição on-chain após um depósito', async () => {
    const data = await fetchPortfolio(manifest.seed.investor);

    expect(Number(data.balance)).toBeCloseTo(Number(manifest.seed.depositEth));
    expect(Number(data.yield)).toBeCloseTo(Number(manifest.seed.yieldEth));
    expect(data.status).toBe('active');
  });

  // TRIAX-5 (erro): gestor inexistente no contrato -> a leitura deve rejeitar
  // com um erro de "não encontrado" (e não estourar de forma genérica).
  it('fetchManagerData rejeita quando o gestor não existe no contrato', async () => {
    await expect(fetchManagerData(manifest.seed.unknownManager)).rejects.toThrow(
      /não encontrado|not found|inexistente/i,
    );
  });
});
