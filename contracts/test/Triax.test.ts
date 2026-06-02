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

  // Açúcar: aprova e deposita `amount` do token pelo investidor, vinculando-o
  // ao gestor `manager`.
  async function approveAndDeposit(
    triax: Awaited<ReturnType<typeof deployFixture>>['triax'],
    token: Awaited<ReturnType<typeof deployFixture>>['token'],
    investor: Awaited<ReturnType<typeof deployFixture>>['investor'],
    amount: bigint,
    manager: string,
  ) {
    await token.connect(investor).approve(await triax.getAddress(), amount);
    return triax.connect(investor).deposit(amount, manager);
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
      const { triax, token, owner, manager, investor } = await loadFixture(deployFixture);

      const deposit = ethers.parseUnits('100', 18);
      const reportedYield = ethers.parseUnits('5', 18);

      await approveAndDeposit(triax, token, investor, deposit, manager.address);
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
      const { triax, token, manager, investor } = await loadFixture(deployFixture);

      const tx = await approveAndDeposit(triax, token, investor, ethers.parseUnits('100', 18), manager.address);
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
      const { triax, token, manager, investor } = await loadFixture(deployFixture);
      const triaxAddress = await triax.getAddress();

      await token.connect(investor).approve(triaxAddress, AMOUNT);
      await triax.connect(investor).deposit(AMOUNT, manager.address);

      const position = await triax.getPosition(investor.address);
      expect(position.balance).to.equal(AMOUNT);
      expect(position.active).to.equal(true);
      expect(await token.balanceOf(triaxAddress)).to.equal(AMOUNT);
    });

    // Critério: deposit sem approve prévio deve reverter.
    it('reverte quando não há approve prévio', async () => {
      const { triax, manager, investor } = await loadFixture(deployFixture);
      await expect(triax.connect(investor).deposit(AMOUNT, manager.address)).to.be.reverted;
    });

    // Critério: deposit com valor zero deve reverter.
    it('reverte quando o valor do depósito é zero', async () => {
      const { triax, token, manager, investor } = await loadFixture(deployFixture);
      await token.connect(investor).approve(await triax.getAddress(), AMOUNT);
      await expect(triax.connect(investor).deposit(0, manager.address)).to.be.reverted;
    });

    // Critério: getPosition retorna o valor depositado em token (não ETH).
    it('getPosition reflete o valor depositado em token', async () => {
      const { triax, token, manager, investor } = await loadFixture(deployFixture);
      const amount = ethers.parseUnits('250', 18);

      await token.connect(investor).approve(await triax.getAddress(), amount);
      await triax.connect(investor).deposit(amount, manager.address);

      const position = await triax.getPosition(investor.address);
      expect(position.balance).to.equal(amount);
    });
  });

  // ---------------------------------------------------------------------------
  // TRIAX-10 — Gestor ver total sob gestão e comissões (agregado por gestor).
  // O depósito passa a vincular o investidor a um gestor (deposit(amount, manager)),
  // e getManagerStats agrega os investidores daquele gestor.
  // ---------------------------------------------------------------------------
  describe('TRIAX-10 — agregado do gestor (getManagerStats)', () => {
    // Cenário: gestor registrado + 2 investidores vinculados (100 e 50).
    async function managerStatsFixture() {
      const base = await deployFixture();
      const { triax, token, manager, investor, other } = base;
      const triaxAddress = await triax.getAddress();

      await triax.connect(manager).registerManager('Mesa Alpha', 'Tri BTC/ETH/USDT', 0);

      await token.mint(other.address, ethers.parseUnits('1000', 18));

      const a = ethers.parseUnits('100', 18);
      const b = ethers.parseUnits('50', 18);
      await token.connect(investor).approve(triaxAddress, a);
      await triax.connect(investor).deposit(a, manager.address);
      await token.connect(other).approve(triaxAddress, b);
      await triax.connect(other).deposit(b, manager.address);

      return base;
    }

    // Critério: totalDeposited = soma dos depósitos dos investidores do gestor.
    it('getManagerStats retorna o total depositado (soma dos investidores)', async () => {
      const { triax, manager } = await loadFixture(managerStatsFixture);
      const stats = await triax.getManagerStats(manager.address);
      expect(stats.totalDeposited).to.equal(ethers.parseUnits('150', 18));
    });

    // Critério: investorCount = número de investidores vinculados.
    it('getManagerStats retorna o número de investidores', async () => {
      const { triax, manager } = await loadFixture(managerStatsFixture);
      const stats = await triax.getManagerStats(manager.address);
      expect(stats.investorCount).to.equal(2n);
    });

    // Critério: commissionAccrued = comissão acumulada do gestor.
    it('getManagerStats retorna a comissão acumulada', async () => {
      const { triax, manager } = await loadFixture(managerStatsFixture);
      const stats = await triax.getManagerStats(manager.address);
      expect(stats.commissionAccrued).to.equal(0n);
    });

    // Critério: reverte se o endereço não é um gestor registrado.
    it('reverte se o endereço não é um gestor registrado', async () => {
      const { triax, other } = await loadFixture(deployFixture);
      await expect(triax.getManagerStats(other.address)).to.be.reverted;
    });
  });

  // ---------------------------------------------------------------------------
  // TRIAX-11 — Solicitar saque dos fundos (withdraw).
  // O investidor saca total ou parcial; os tokens voltam SEMPRE para o próprio
  // endereço (msg.sender), nunca para terceiros.
  // ---------------------------------------------------------------------------
  describe('TRIAX-11 — saque (withdraw)', () => {
    const DEPOSIT = ethers.parseUnits('100', 18);

    // Investidor com 100 depositados (vinculado ao gestor).
    async function fundedFixture() {
      const base = await deployFixture();
      await approveAndDeposit(base.triax, base.token, base.investor, DEPOSIT, base.manager.address);
      return base;
    }

    // Critério: withdraw transfere os tokens de volta ao usuário.
    it('transfere os tokens de volta ao usuário', async () => {
      const { triax, token, investor } = await loadFixture(fundedFixture);
      const before = await token.balanceOf(investor.address);

      await triax.connect(investor).withdraw(ethers.parseUnits('40', 18));

      const after = await token.balanceOf(investor.address);
      expect(after - before).to.equal(ethers.parseUnits('40', 18));
    });

    // Critério: withdraw atualiza o saldo da posição.
    it('atualiza o saldo da posição', async () => {
      const { triax, investor } = await loadFixture(fundedFixture);
      await triax.connect(investor).withdraw(ethers.parseUnits('40', 18));

      const position = await triax.getPosition(investor.address);
      expect(position.balance).to.equal(ethers.parseUnits('60', 18));
    });

    // Critério: sacar o saldo total encerra a posição (active = false).
    it('encerra a posição ao sacar o saldo total', async () => {
      const { triax, investor } = await loadFixture(fundedFixture);
      await triax.connect(investor).withdraw(DEPOSIT);

      const position = await triax.getPosition(investor.address);
      expect(position.balance).to.equal(0n);
      expect(position.active).to.equal(false);
    });

    // Critério: sacar mais que o saldo deve reverter.
    it('reverte ao sacar mais que o saldo', async () => {
      const { triax, investor } = await loadFixture(fundedFixture);
      await expect(
        triax.connect(investor).withdraw(ethers.parseUnits('101', 18)),
      ).to.be.reverted;
    });

    // Critério: sacar zero deve reverter.
    it('reverte ao sacar zero', async () => {
      const { triax, investor } = await loadFixture(fundedFixture);
      await expect(triax.connect(investor).withdraw(0)).to.be.reverted;
    });

    // Critério: só o próprio investidor saca — um terceiro (sem posição) não
    // consegue acessar fundos alheios; seu withdraw reverte.
    it('terceiro não consegue sacar (saca só a própria posição)', async () => {
      const { triax, other } = await loadFixture(fundedFixture);
      await expect(triax.connect(other).withdraw(DEPOSIT)).to.be.reverted;
    });
  });
});
