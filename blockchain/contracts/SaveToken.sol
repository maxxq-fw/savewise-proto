// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract SaveToken is ERC20, ERC20Burnable, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    uint256 public constant INITIAL_SUPPLY = 1_000_000 * 10 ** 18;

    constructor(address admin) ERC20("SaveWise Token", "SAVE") {
        require(admin != address(0), "SaveToken: zero admin address");

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);

        _mint(admin, INITIAL_SUPPLY);
    }

    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        require(to != address(0), "SaveToken: zero receiver address");
        require(amount > 0, "SaveToken: amount must be positive");

        _mint(to, amount);
    }

    function burnByMinter(address from, uint256 amount) external onlyRole(MINTER_ROLE) {
        require(from != address(0), "SaveToken: zero burn address");
        require(amount > 0, "SaveToken: amount must be positive");

        _burn(from, amount);
    }
}