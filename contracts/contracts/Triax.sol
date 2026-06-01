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

    mapping(address => Manager) private managers;
    mapping(address => Position) private positions;

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

    // TRIAX-8 — investidor deposita `amount` do token (exige approve prévio).
    // Puxa os tokens via transferFrom; credita o saldo e ativa a posição.
    function deposit(uint256 amount) external {
        require(amount > 0, "amount must be > 0");

        Position storage p = positions[msg.sender];
        if (p.depositedAt == 0) {
            p.depositedAt = block.timestamp;
        }
        p.balance += amount;
        p.active = true;

        // interação por último (CEI). transferFrom reverte se faltar allowance/saldo.
        require(token.transferFrom(msg.sender, address(this), amount), "transfer failed");

        emit Deposited(msg.sender, amount);
    }

    // TRIAX-7 — bot/owner reporta o rendimento acumulado de um investidor.
    function reportYield(address user, uint256 amount) external onlyOwner {
        positions[user].yieldAmount += amount;
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
}
