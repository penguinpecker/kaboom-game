// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {SomniaEventHandler} from "@somnia-chain/reactivity-contracts/contracts/SomniaEventHandler.sol";
import "./KaboomVault.sol";

/// @title ReactiveRiskGuardian - Autonomous vault risk management via Somnia Reactivity
/// @notice Subscribes to GameSettled + VaultBalanceChanged. Auto-tightens/loosens bet limits.
/// @dev Categories: DeFi + Automation
contract ReactiveRiskGuardian is SomniaEventHandler {

    KaboomVault public vault;
    address public owner;

    // Thresholds (health percent of peak)
    uint256 public constant EMERGENCY_THRESHOLD = 50;  // <50% → pause high mines
    uint256 public constant CAUTION_THRESHOLD = 70;    // <70% → tighten to 0.5%
    uint256 public constant HEALTHY_THRESHOLD = 90;    // >90% → restore to 1%

    // Risk states
    enum RiskLevel { Healthy, Caution, Emergency }
    RiskLevel public currentRisk;

    // Track stats
    uint256 public totalGamesProcessed;
    uint256 public lastAdjustmentBlock;

    // ═══ EVENTS ═══
    event RiskAdjusted(RiskLevel level, uint256 healthPercent, uint256 newMaxBetPercent);
    event WhaleActivityFlagged(address indexed player, uint256 amount);
    event GuardianTriggered(uint256 gameId, bool won, uint256 healthPercent);

    constructor(address _vault) {
        vault = KaboomVault(payable(_vault));
        owner = msg.sender;
        currentRisk = RiskLevel.Healthy;
    }

    /// @notice Called by Somnia validators when subscribed events fire
    /// @dev Decodes GameSettled or VaultBalanceChanged and adjusts risk
    function _onEvent(
        address,
        bytes32[] calldata eventTopics,
        bytes calldata data
    ) internal override {
        // GameSettled(uint256 gameId, address player, bool won, uint256 amount, uint256 multiplier)
        bytes32 gameSettledSig = keccak256("GameSettled(uint256,address,bool,uint256,uint256)");
        // VaultBalanceChanged(uint256 newBalance, uint256 peakBalance)
        bytes32 vaultChangedSig = keccak256("VaultBalanceChanged(uint256,uint256)");

        bytes32 eventSig = eventTopics[0];

        if (eventSig == gameSettledSig) {
            _handleGameSettled(eventTopics, data);
        } else if (eventSig == vaultChangedSig) {
            _handleVaultChanged(data);
        }
    }

    function _handleGameSettled(bytes32[] calldata topics, bytes calldata data) internal {
        // Decode: gameId from topics[1], player from topics[2]
        // data: (bool won, uint256 amount, uint256 multiplier)
        (bool won, , ) = abi.decode(data, (bool, uint256, uint256));

        totalGamesProcessed++;

        uint256 health = vault.getHealthPercent();
        emit GuardianTriggered(uint256(topics[1]), won, health);

        _adjustRisk(health);
    }

    function _handleVaultChanged(bytes calldata data) internal {
        (uint256 newBalance, uint256 peak) = abi.decode(data, (uint256, uint256));
        uint256 health = peak > 0 ? (newBalance * 100) / peak : 100;
        _adjustRisk(health);
    }

    function _adjustRisk(uint256 healthPercent) internal {
        RiskLevel newLevel;
        uint256 newMaxBet;

        if (healthPercent < EMERGENCY_THRESHOLD) {
            newLevel = RiskLevel.Emergency;
            newMaxBet = 25; // 0.25%
        } else if (healthPercent < CAUTION_THRESHOLD) {
            newLevel = RiskLevel.Caution;
            newMaxBet = 50; // 0.5%
        } else if (healthPercent >= HEALTHY_THRESHOLD) {
            newLevel = RiskLevel.Healthy;
            newMaxBet = 100; // 1%
        } else {
            return; // In between, no change
        }

        if (newLevel != currentRisk) {
            currentRisk = newLevel;
            lastAdjustmentBlock = block.number;
            vault.setMaxBetPercent(newMaxBet);
            emit RiskAdjusted(newLevel, healthPercent, newMaxBet);
        }
    }

    /// @notice Flag whale activity (called by ReactiveWhaleAlert)
    function flagWhaleActivity(address player, uint256 amount) external {
        emit WhaleActivityFlagged(player, amount);
        // Could trigger additional risk tightening here
        uint256 health = vault.getHealthPercent();
        if (health < 80) {
            _adjustRisk(health);
        }
    }
}
