// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/// @title Triax — suporte on-chain às histórias P0 (TRIAX-5 gestor, TRIAX-7 posição).
/// @notice Implementação mínima (TDD/simple design): só o necessário para os testes.
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
    }

    mapping(address => Manager) private managers;
    mapping(address => Position) private positions;

    event ManagerRegistered(address indexed manager, string name, string strategy, ManagerStatus status);
    event Deposited(address indexed user, uint256 amount);
    event YieldReported(address indexed user, uint256 amount);

    error ManagerNotFound(address account);

    constructor() Ownable(msg.sender) {}

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

    // TRIAX-7 — investidor deposita; o saldo é creditado e a posição fica ativa.
    function deposit() external payable {
        Position storage p = positions[msg.sender];
        p.balance += msg.value;
        p.active = true;
        emit Deposited(msg.sender, msg.value);
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
        returns (uint256 balance, uint256 yieldAmount, bool active)
    {
        Position storage p = positions[user];
        return (p.balance, p.yieldAmount, p.active);
    }
}
