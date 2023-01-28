// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TokenB is ERC20, Ownable {
    uint8 private _decimals;
    constructor(string memory name, uint8 decimal, string memory symbol) ERC20(name,symbol) {
        _decimals = decimal;
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
    function decimals() public view virtual override returns (uint8) {
        return 6;
    }
}
