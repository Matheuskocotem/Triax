/**
 * Triax.sol — testes (Hardhat + Chai).
 *
 * Cobre TRIAX-5 (gestor), TRIAX-7 (posição) e TRIAX-8 (depósito ERC-20).
 * O contrato custodia um token ERC-20; depósitos são via approve + deposit.
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
  // Implanta MockERC20 + Triax (que custodia o token) e financia o investidor.
  // Papéis: owner (deploy/bot), manager (gestor), investor, other.
  async function deployFixture() {
    const [owner, manager, investor, other] = await ethers.getSigners();

    const Token = await ethers.getContractFactory('MockERC20');
    const token = await Token.deploy();
    await token.waitForDeployment();

    const Triax = await ethers.getContractFactory('Triax');
    const triax = await Triax.deploy(await token.getAddress());
    await triax.waitForDeployment();

    await token.mint(investor.address, ethers.parseUnits('1000', 18));

    return { triax, token, owner, manager, investor, other };
  }

  // Açúcar: aprova e deposita `amount` do token pelo investidor.
  async function approveAndDeposit(
    triax: Awaited<ReturnType<typeof deployFixture>>['triax'],
    token: Awaited<ReturnType<typeof deployFixture>>['token'],
    investor: Awaited<ReturnType<typeof deployFixture>>['investor'],
    amount: bigint,
  ) {
    await token.connect(investor).approve(await triax.getAddress(), amount);
    return triax.connect(investor).deposit(amount);
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
      const { triax, token, owner, investor } = await loadFixture(deployFixture);

      const deposit = ethers.parseUnits('100', 18);
      const reportedYield = ethers.parseUnits('5', 18);

      await approveAndDeposit(triax, token, investor, deposit);
      await triax.connect(owner).reportYield(investor.address, reportedYield);

      const position = await triax.getPosition(investor.address);
      expect(position.balance).to.equal(deposit);
      expect(position.yieldAmount).to.equal(reportedYield);
      expect(position.active).to.equal(true);
    });

    // Critério: registrar o timestamp do depósito (FATO bruto on-chain) — o
    // frontend deriva o APY a partir desse instante. getPosition deve expor
    // `depositedAt` igual ao timestamp do bloco do primeiro depósito.
    it('registra o timestamp do depósito (depositedAt)', async () => {
      const { triax, token, investor } = await loadFixture(deployFixture);

      const tx = await approveAndDeposit(triax, token, investor, ethers.parseUnits('100', 18));
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt!.blockNumber);

      const position = await triax.getPosition(investor.address);
      expect(position.depositedAt).to.equal(BigInt(block!.timestamp));
    });
  });

  // ---------------------------------------------------------------------------
  // Segurança — controle de acesso ao reporte de rendimento (TRIAX-7 / EP-02).
  // Só o owner (bot/plataforma) pode reportar rendimento; ninguém mais pode
  // inflar a posição de um investidor.
  // ---------------------------------------------------------------------------
  describe('Segurança — controle de acesso de reportYield (TRIAX-7 / EP-02)', () => {
    // Critério: reportYield chamado por quem NÃO é owner deve reverter e não
    // alterar a posição do investidor.
    it('reverte quando reportYield é chamado por um endereço que não é owner', async () => {
      const { triax, investor, other } = await loadFixture(deployFixture);

      await expect(
        triax.connect(other).reportYield(investor.address, ethers.parseEther('0.05')),
      ).to.be.reverted;

      // a posição permanece intacta (rendimento não foi creditado)
      const position = await triax.getPosition(investor.address);
      expect(position.yieldAmount).to.equal(0n);
    });

    // Critério: reportYield chamado pelo owner funciona — credita o rendimento.
    it('permite que o owner reporte rendimento', async () => {
      const { triax, owner, investor } = await loadFixture(deployFixture);

      const reportedYield = ethers.parseEther('0.05');
      await triax.connect(owner).reportYield(investor.address, reportedYield);

      const position = await triax.getPosition(investor.address);
      expect(position.yieldAmount).to.equal(reportedYield);
    });
  });

  // ---------------------------------------------------------------------------
  // TRIAX-8 — Fazer depósito no smart contract (ERC-20: approve + deposit).
  // O Triax passa a custodiar um token ERC-20 (USDT). deposit(amount) puxa os
  // tokens via transferFrom — exige approve prévio do investidor.
  // ---------------------------------------------------------------------------
  describe('TRIAX-8 — depósito de token ERC-20 (approve + deposit)', () => {
    const AMOUNT = ethers.parseUnits('100', 18);

    // Critério: approve + deposit credita a posição e aumenta o saldo do contrato.
    it('approve + deposit credita a posição e o saldo do contrato', async () => {
      const { triax, token, investor } = await loadFixture(deployFixture);
      const triaxAddress = await triax.getAddress();

      await token.connect(investor).approve(triaxAddress, AMOUNT);
      await triax.connect(investor).deposit(AMOUNT);

      const position = await triax.getPosition(investor.address);
      expect(position.balance).to.equal(AMOUNT);
      expect(position.active).to.equal(true);
      expect(await token.balanceOf(triaxAddress)).to.equal(AMOUNT);
    });

    // Critério: deposit sem approve prévio deve reverter.
    it('reverte quando não há approve prévio', async () => {
      const { triax, investor } = await loadFixture(deployFixture);
      await expect(triax.connect(investor).deposit(AMOUNT)).to.be.reverted;
    });

    // Critério: deposit com valor zero deve reverter.
    it('reverte quando o valor do depósito é zero', async () => {
      const { triax, token, investor } = await loadFixture(deployFixture);
      await token.connect(investor).approve(await triax.getAddress(), AMOUNT);
      await expect(triax.connect(investor).deposit(0)).to.be.reverted;
    });

    // Critério: getPosition retorna o valor depositado em token (não ETH).
    it('getPosition reflete o valor depositado em token', async () => {
      const { triax, token, investor } = await loadFixture(deployFixture);
      const amount = ethers.parseUnits('250', 18);

      await token.connect(investor).approve(await triax.getAddress(), amount);
      await triax.connect(investor).deposit(amount);

      const position = await triax.getPosition(investor.address);
      expect(position.balance).to.equal(amount);
    });
  });
});
