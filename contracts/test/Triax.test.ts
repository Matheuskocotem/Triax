/**
 * Triax.sol — testes (Hardhat + Chai), fase TDD: RED.
 *
 * Estes testes descrevem a interface-alvo do contrato que dá suporte às
 * histórias P0 já cobertas no frontend (TRIAX-5 e TRIAX-7). O contrato ainda
 * NÃO foi implementado — espera-se que TODOS estes testes FALHEM (red).
 *
 * Usa as contas de teste do Hardhat (ethers.getSigners()).
 */
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers';

// Espelho do enum de status do gestor previsto no contrato.
// bigint porque o ethers v6 decodifica enums/uint como bigint (e o chai
// `.equal` é estrito: 0n !== 0).
const ManagerStatus = { Active: 0n, Paused: 1n, Closed: 2n } as const;

describe('Triax', () => {
  // Implanta um contrato novo para cada teste e separa os papéis nas contas
  // de teste do Hardhat: owner (deploy), manager (gestor), investor, other.
  async function deployFixture() {
    const [owner, manager, investor, other] = await ethers.getSigners();
    const Triax = await ethers.getContractFactory('Triax');
    const triax = await Triax.deploy();
    await triax.waitForDeployment();
    return { triax, owner, manager, investor, other };
  }

  // ---------------------------------------------------------------------------
  // TRIAX-5 — Acessar link com ?manager= e ver dados do gestor
  // (suporte on-chain: registrar e ler o gestor pelo endereço)
  // ---------------------------------------------------------------------------
  describe('TRIAX-5 — registro e leitura de gestor', () => {
    // Critério: registrar manager (nome, estratégia, status) e ler por endereço.
    it('registra um gestor e o lê por endereço', async () => {
      const { triax, manager } = await loadFixture(deployFixture);

      await triax
        .connect(manager)
        .registerManager('Mesa Alpha', 'Triangulação BTC/ETH/USDT', ManagerStatus.Active);

      const data = await triax.getManager(manager.address);
      expect(data.name).to.equal('Mesa Alpha');
      expect(data.strategy).to.equal('Triangulação BTC/ETH/USDT');
      expect(data.status).to.equal(ManagerStatus.Active);
    });

    // Critério: ler um gestor inexistente deve reverter (não retornar lixo).
    it('reverte ao ler um gestor que não existe', async () => {
      const { triax, other } = await loadFixture(deployFixture);

      await expect(triax.getManager(other.address)).to.be.reverted;
    });
  });

  // ---------------------------------------------------------------------------
  // TRIAX-7 — Ver saldo e posições no contrato
  // (suporte on-chain: posição do usuário — vazia ou com depósito + rendimento)
  // ---------------------------------------------------------------------------
  describe('TRIAX-7 — posição do usuário', () => {
    // Critério: usuário sem posição → estado vazio (saldo 0, rendimento 0, inativo).
    it('retorna estado vazio para um usuário sem posição', async () => {
      const { triax, investor } = await loadFixture(deployFixture);

      const position = await triax.getPosition(investor.address);
      expect(position.balance).to.equal(0n);
      expect(position.yieldAmount).to.equal(0n);
      expect(position.active).to.equal(false);
    });

    // Critério: usuário com depósito → saldo reflete o depósito, posição ativa,
    // e o rendimento reportado (pelo bot/owner) fica legível.
    it('reflete saldo e rendimento após um depósito', async () => {
      const { triax, owner, investor } = await loadFixture(deployFixture);

      const deposit = ethers.parseEther('1');
      const reportedYield = ethers.parseEther('0.05');

      await triax.connect(investor).deposit({ value: deposit });
      await triax.connect(owner).reportYield(investor.address, reportedYield);

      const position = await triax.getPosition(investor.address);
      expect(position.balance).to.equal(deposit);
      expect(position.yieldAmount).to.equal(reportedYield);
      expect(position.active).to.equal(true);
    });
  });
});
