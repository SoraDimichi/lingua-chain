// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../contracts/LCTGovernance.sol";
import "../contracts/LCToken.sol";

contract DeployLCTGovernance is Script {
    function run() external {
        vm.startBroadcast();

        LCToken lcToken = new LCToken(5 ether);
        LCTGovernance governance = new LCTGovernance(lcToken, 1 ether);

        uint256 currentDay = block.timestamp / 1 days;
        governance.createProposal(
            "Increase Rewards",
            "Proposal to increase reward distribution by 10%",
            currentDay + 7 days
        );
        governance.createProposal(
            "Reduce Fees",
            "Proposal to reduce transaction fees",
            currentDay + 10 days
        );
        governance.createProposal(
            "New Feature",
            "Proposal to introduce new features",
            currentDay + 14 days
        );

        vm.stopBroadcast();

        console.log("VITE_LCTOKEN=", address(lcToken));
        console.log("VITE_LCTGOVERNANCE=", address(governance));
    }
}
