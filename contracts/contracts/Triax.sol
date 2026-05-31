// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Triax is Ownable {
    address public manager;

    event ManagerUpdated(address indexed oldManager, address indexed newManager);

    constructor(address _manager) Ownable(msg.sender) {
        manager = _manager;
    }

    function setManager(address _manager) external onlyOwner {
        emit ManagerUpdated(manager, _manager);
        manager = _manager;
    }
}
