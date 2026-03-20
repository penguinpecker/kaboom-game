// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {SomniaEventHandler} from "@somnia-chain/reactivity-contracts/contracts/SomniaEventHandler.sol";

/// @title ReactiveReferral - Automatic referral rewards via Somnia Reactivity
/// @notice Subscribes to BetPlaced events. Credits 1% of bet to referrer.
/// @dev Category: Onchain Tracker
contract ReactiveReferral is SomniaEventHandler {

    uint256 public constant REFERRAL_BPS = 100; // 1% = 100 basis points

    struct ReferralStats {
        uint256 totalEarned;
        uint256 totalReferredVolume;
        uint256 referralCount;
        uint256 pendingBalance;
    }

    mapping(address => ReferralStats) public referralStats;
    mapping(address => address) public referrerOf; // player → who referred them

    uint256 public totalReferralsPaid;
    uint256 public totalReferredVolume;

    // ═══ EVENTS ═══
    event ReferralCredited(address indexed referrer, address indexed player, uint256 betAmount, uint256 reward);
    event ReferralClaimed(address indexed referrer, uint256 amount);
    event ReferralRegistered(address indexed player, address indexed referrer);

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
            (uint256 amount, address referrer) = abi.decode(data, (uint256, address));

            if (referrer != address(0) && referrer != player) {
                _creditReferral(referrer, player, amount);
            }
        }
    }

    function _creditReferral(address referrer, address player, uint256 betAmount) internal {
        // Register referral relationship if new
        if (referrerOf[player] == address(0)) {
            referrerOf[player] = referrer;
            referralStats[referrer].referralCount++;
            emit ReferralRegistered(player, referrer);
        }

        // Calculate and credit reward
        uint256 reward = (betAmount * REFERRAL_BPS) / 10000;
        referralStats[referrer].totalEarned += reward;
        referralStats[referrer].totalReferredVolume += betAmount;
        referralStats[referrer].pendingBalance += reward;

        totalReferralsPaid += reward;
        totalReferredVolume += betAmount;

        emit ReferralCredited(referrer, player, betAmount, reward);
    }

    /// @notice Claim accumulated referral rewards
    function claimRewards() external {
        uint256 amount = referralStats[msg.sender].pendingBalance;
        require(amount > 0, "Nothing to claim");
        referralStats[msg.sender].pendingBalance = 0;
        // In production, this would transfer from a reward pool
        // For hackathon demo, we track it as credited
        emit ReferralClaimed(msg.sender, amount);
    }

    // ═══ VIEWS ═══

    function getReferralStats(address referrer) external view returns (ReferralStats memory) {
        return referralStats[referrer];
    }

    function getReferrerOf(address player) external view returns (address) {
        return referrerOf[player];
    }
}
