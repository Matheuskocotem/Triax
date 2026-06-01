/**
 * Deploy local do Triax.sol na rede Hardhat + seed de dados, exportando o
 * manifest (endereço + ABI + dados semeados) para o frontend consumir.
 *
 * Uso:
 *   npx hardhat node                                  # terminal 1 (rede local)
 *   npx hardhat run scripts/deploy.ts --network localhost   # terminal 2
 *
 * Gera: frontend/src/lib/contract/triax.deployment.json
 */
import { ethers, artifacts } from 'hardhat';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, resolve } from 'path';

async function main() {
  // Contas do Hardhat separadas por papel.
  const [owner, manager, investor, unknown] = await ethers.getSigners();

  // Token ERC-20 de teste (18 casas). Em produção seria o USDT real.
  const Token = await ethers.getContractFactory('MockERC20');
  const token = await Token.deploy();
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();

  const Triax = await ethers.getContractFactory('Triax');
  const triax = await Triax.deploy(tokenAddress);
  await triax.waitForDeployment();
  const address = await triax.getAddress();

  // Seed TRIAX-5: registra um gestor real (status 0 = Active).
  const managerData = {
    name: 'Mesa Alpha',
    strategy: 'Triangulação BTC/ETH/USDT',
    status: 0,
  };
  await (
    await triax
      .connect(manager)
      .registerManager(managerData.name, managerData.strategy, managerData.status)
  ).wait();

  // Seed TRIAX-7/8: financia o investidor, aprova e deposita (ERC-20), e o
  // owner reporta rendimento. Valores em token (18 casas).
  const depositEth = '1.0';
  const yieldEth = '0.05';
  const depositAmount = ethers.parseUnits(depositEth, 18);
  await (await token.mint(investor.address, ethers.parseUnits('1000', 18))).wait();
  await (await token.connect(investor).approve(address, depositAmount)).wait();
  await (await triax.connect(investor).deposit(depositAmount)).wait();
  await (
    await triax.connect(owner).reportYield(investor.address, ethers.parseUnits(yieldEth, 18))
  ).wait();

  const artifact = await artifacts.readArtifact('Triax');
  const network = await ethers.provider.getNetwork();

  const manifest = {
    chainId: Number(network.chainId),
    rpcUrl: 'http://127.0.0.1:8545',
    address,
    token: tokenAddress,
    abi: artifact.abi,
    seed: {
      owner: owner.address,
      manager: manager.address,
      managerData,
      investor: investor.address,
      depositEth,
      yieldEth,
      // Conta nunca registrada como gestor — usada para o caso de erro.
      unknownManager: unknown.address,
    },
  };

  const out = resolve(
    __dirname,
    '../../frontend/src/lib/contract/triax.deployment.json',
  );
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify(manifest, null, 2) + '\n');

  console.log(`Triax deployed at ${address} (chainId ${manifest.chainId})`);
  console.log(`Manifest exported to ${out}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
