// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {SomniaEventHandler} from "@somnia-chain/reactivity-contracts/contracts/SomniaEventHandler.sol";
import "./KaboomVault.sol";
import "./ReactiveRiskGuardian.sol";

/// @title ReactiveWhaleAlert - Monitors large bets via Somnia Reactivity
/// @notice Subscribes to BetPlaced events. Flags bets > 5% of vault and notifies RiskGuardian.
/// @dev Category: Onchain Tracker
contract ReactiveWhaleAlert is SomniaEventHandler {

    uint256 public constant WHALE_THRESHOLD_BPS = 500; // 5% of vault

    KaboomVault public vault;
    ReactiveRiskGuardian public riskGuardian;
    address public owner;

    struct WhaleEvent {
        address player;
        uint256 amount;
        uint256 vaultBalance;
        uint256 percentOfVault; // basis points
        uint256 timestamp;
        uint256 blockNumber;
    }

    WhaleEvent[] public whaleEvents;
    uint256 public totalWhaleAlerts;
    mapping(address => uint256) public whaleAlertCount;

    // ═══ EVENTS ═══
    event WhaleDetected(
        address indexed player,
        uint256 amount,
        uint256 vaultBalance,
        uint256 percentBps,
        uint256 indexed blockNumber
    );
    event RiskGuardianNotified(address indexed player, uint256 amount);

    constructor(address _vault, address _riskGuardian) {
        vault = KaboomVault(payable(_vault));
        riskGuardian = ReactiveRiskGuardian(_riskGuardian);
        owner = msg.sender;
    }

    /// @notice Reactive handler — called by Somnia validators on BetPlaced events
    function _onEvent(
        address,
        bytes32[] calldata eventTopics,
        bytes calldata data
    ) internal override {
        bytes32 betPlacedSig = keccak256("BetPlaced(uint256,address,uint256,address)");

        if (eventTopics[0] == betPlacedSig) {
            // topics[2] = player (indexed)
            address player = address(uint160(uint256(eventTopics[2])));
            // data = (uint256 amount, address referrer)
            (uint256 amount, ) = abi.decode(data, (uint256, address));

            _checkWhale(player, amount);
        }
    }

    function _checkWhale(address player, uint256 amount) internal {
        uint256 vaultBal = vault.getBalance();
        if (vaultBal == 0) return;

        uint256 percentBps = (amount * 10000) / vaultBal;

        if (percentBps >= WHALE_THRESHOLD_BPS) {
            // Whale detected!
            totalWhaleAlerts++;
            whaleAlertCount[player]++;

            WhaleEvent memory evt = WhaleEvent({
                player: player,
                amount: amount,
                vaultBalance: vaultBal,
                percentOfVault: percentBps,
                timestamp: block.timestamp,
                blockNumber: block.number
            });
            whaleEvents.push(evt);

            emit WhaleDetected(player, amount, vaultBal, percentBps, block.number);

            // Notify risk guardian
            riskGuardian.flagWhaleActivity(player, amount);
            emit RiskGuardianNotified(player, amount);
        }
    }

    // ═══ VIEWS ═══

    function getWhaleEventsCount() external view returns (uint256) {
        return whaleEvents.length;
    }

    function getRecentWhaleEvents(uint256 count) external view returns (WhaleEvent[] memory) {
        uint256 total = whaleEvents.length;
        if (count > total) count = total;
        WhaleEvent[] memory recent = new WhaleEvent[](count);
        for (uint256 i = 0; i < count; i++) {
            recent[i] = whaleEvents[total - count + i];
        }
        return recent;
    }
}
