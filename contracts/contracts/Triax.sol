// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title Triax — suporte on-chain às histórias P0 (TRIAX-5 gestor, TRIAX-7/8 posição).
/// @notice Implementação mínima (TDD/simple design): só o necessário para os testes.
/// @dev Custodia um único token ERC-20 (ex.: USDT). Depósitos via approve + deposit.
contract Triax is Ownable {
    enum ManagerStatus { Active, Paused, Closed }

    struct Manager {
        string name;
        string strategy;
        ManagerStatus status;
        bool exists;
    }

    struct Position {
        uint256 balance;
        uint256 yieldAmount;
        bool active;
        uint256 depositedAt; // timestamp do primeiro depósito (início do rendimento)
    }

    struct ManagerStats {
        uint256 totalDeposited;
        uint256 investorCount;
        uint256 commissionAccrued;
    }

    /// Comissão do gestor: 10% do rendimento reportado (fixo por ora; TRIAX-12).
    uint256 public constant COMMISSION_BPS = 1000; // 1000 / 10000 = 10%

    mapping(address => Manager) private managers;
    mapping(address => Position) private positions;
    mapping(address => ManagerStats) private managerStats; // por gestor
    mapping(address => address) private investorManager;   // investidor → gestor

    /// Token ERC-20 custodiado pelo contrato (definido no deploy).
    IERC20 public immutable token;

    event ManagerRegistered(address indexed manager, string name, string strategy, ManagerStatus status);
    event Deposited(address indexed user, uint256 amount);
    event YieldReported(address indexed user, uint256 amount);

    error ManagerNotFound(address account);

    constructor(IERC20 _token) Ownable(msg.sender) {
        token = _token;
    }

    // TRIAX-5 — o próprio gestor (msg.sender) registra nome, estratégia e status.
    function registerManager(
        string calldata name,
        string calldata strategy,
        ManagerStatus status
    ) external {
        managers[msg.sender] = Manager({ name: name, strategy: strategy, status: status, exists: true });
        emit ManagerRegistered(msg.sender, name, strategy, status);
    }

    // TRIAX-5 — lê o gestor pelo endereço; reverte se não existe.
    function getManager(address account)
        external
        view
        returns (string memory name, string memory strategy, ManagerStatus status)
    {
        Manager storage m = managers[account];
        if (!m.exists) revert ManagerNotFound(account);
        return (m.name, m.strategy, m.status);
    }

    // TRIAX-8/10 — investidor deposita `amount` do token e fica vinculado a um
    // gestor (exige approve prévio). Puxa os tokens via transferFrom, credita o
    // saldo, ativa a posição e atualiza o agregado do gestor.
    function deposit(uint256 amount, address manager) external {
        require(amount > 0, "amount must be > 0");

        Position storage p = positions[msg.sender];
        if (p.depositedAt == 0) {
            p.depositedAt = block.timestamp;
        }
        p.balance += amount;
        p.active = true;

        // Vincula o investidor ao gestor na 1ª vez e conta-o uma única vez.
        if (investorManager[msg.sender] == address(0)) {
            investorManager[msg.sender] = manager;
            managerStats[manager].investorCount += 1;
        }
        managerStats[investorManager[msg.sender]].totalDeposited += amount;

        // interação por último (CEI). transferFrom reverte se faltar allowance/saldo.
        require(token.transferFrom(msg.sender, address(this), amount), "transfer failed");

        emit Deposited(msg.sender, amount);
    }

    // TRIAX-7/10 — bot/owner reporta o rendimento de um investidor; 10% vira
    // comissão acumulada do gestor vinculado.
    function reportYield(address user, uint256 amount) external onlyOwner {
        positions[user].yieldAmount += amount;

        address manager = investorManager[user];
        if (manager != address(0)) {
            managerStats[manager].commissionAccrued += (amount * COMMISSION_BPS) / 10000;
        }

        emit YieldReported(user, amount);
    }

    // TRIAX-7 — lê a posição; zerada e inativa quando não há depósito.
    function getPosition(address user)
        external
        view
        returns (uint256 balance, uint256 yieldAmount, bool active, uint256 depositedAt)
    {
        Position storage p = positions[user];
        return (p.balance, p.yieldAmount, p.active, p.depositedAt);
    }

    // TRIAX-10 — agregado do gestor; reverte se não for gestor registrado.
    function getManagerStats(address manager)
        external
        view
        returns (uint256 totalDeposited, uint256 investorCount, uint256 commissionAccrued)
    {
        if (!managers[manager].exists) revert ManagerNotFound(manager);
        ManagerStats storage s = managerStats[manager];
        return (s.totalDeposited, s.investorCount, s.commissionAccrued);
    }
}
