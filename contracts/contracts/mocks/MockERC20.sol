// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// Token ERC-20 só para testes (fixture). Permite cunhar livremente.
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
    constructor() ERC20("Mock USD", "mUSD") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
