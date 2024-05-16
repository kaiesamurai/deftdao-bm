//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract RollToken is ERC20 {
    constructor() ERC20("RollSwap", "ROLL") {
        _mint(msg.sender, 1000 ether); // mints 1000 balloons!
    }
}