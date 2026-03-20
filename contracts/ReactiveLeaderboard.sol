// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {SomniaEventHandler} from "@somnia-chain/reactivity-contracts/contracts/SomniaEventHandler.sol";

/// @title ReactiveLeaderboard - Auto-updating player rankings via Somnia Reactivity
/// @notice Subscribes to GameWon events. Maintains top 10 leaderboard on-chain.
/// @dev Category: Gaming
contract ReactiveLeaderboard is SomniaEventHandler {

    struct PlayerStats {
        uint256 totalWon;
        uint256 biggestWin;
        uint256 biggestMultiplier; // WAD scaled
        uint256 gamesWon;
        uint256 gamesPlayed;
        uint256 lastActive;
    }

    struct LeaderEntry {
        address player;
        uint256 biggestWin;
        uint256 biggestMultiplier;
    }

    uint8 public constant MAX_LEADERS = 10;

    mapping(address => PlayerStats) public playerStats;
    LeaderEntry[10] public leaderboard;
    uint8 public leaderCount;

    uint256 public totalGamesTracked;
    uint256 public totalPayoutsTracked;

    // ═══ EVENTS ═══
    event LeaderboardUpdated(address indexed player, uint256 biggestWin, uint256 multiplier, uint8 rank);
    event PlayerStatsUpdated(address indexed player, uint256 totalWon, uint256 gamesWon);

    /// @notice Reactive handler — called by Somnia validators on GameWon events
    function _onEvent(
        address,
        bytes32[] calldata eventTopics,
        bytes calldata data
    ) internal override {
        bytes32 gameWonSig = keccak256("GameWon(uint256,address,uint256,uint256)");

        if (eventTopics[0] == gameWonSig) {
            // topics[2] = player (indexed)
            address player = address(uint160(uint256(eventTopics[2])));
            // data = (uint256 payout, uint256 multiplier)
            (uint256 payout, uint256 multiplier) = abi.decode(data, (uint256, uint256));

            _processWin(player, payout, multiplier);
        }
    }

    function _processWin(address player, uint256 payout, uint256 multiplier) internal {
        // Update player stats
        PlayerStats storage stats = playerStats[player];
        stats.totalWon += payout;
        stats.gamesWon++;
        stats.lastActive = block.timestamp;

        if (payout > stats.biggestWin) stats.biggestWin = payout;
        if (multiplier > stats.biggestMultiplier) stats.biggestMultiplier = multiplier;

        totalGamesTracked++;
        totalPayoutsTracked += payout;

        emit PlayerStatsUpdated(player, stats.totalWon, stats.gamesWon);

        // Update leaderboard (sorted by biggest win)
        _updateLeaderboard(player, stats.biggestWin, stats.biggestMultiplier);
    }

    function _updateLeaderboard(address player, uint256 biggestWin, uint256 biggestMult) internal {
        // Check if player already on board
        int8 existingIdx = -1;
        for (uint8 i = 0; i < leaderCount; i++) {
            if (leaderboard[i].player == player) {
                existingIdx = int8(i);
                leaderboard[i].biggestWin = biggestWin;
                leaderboard[i].biggestMultiplier = biggestMult;
                break;
            }
        }

        // If not on board and board not full, add
        if (existingIdx == -1 && leaderCount < MAX_LEADERS) {
            leaderboard[leaderCount] = LeaderEntry(player, biggestWin, biggestMult);
            leaderCount++;
        } else if (existingIdx == -1) {
            // Board full — check if player beats the last entry
            if (biggestWin > leaderboard[leaderCount - 1].biggestWin) {
                leaderboard[leaderCount - 1] = LeaderEntry(player, biggestWin, biggestMult);
            }
        }

        // Bubble sort (small array, gas-acceptable)
        for (uint8 i = 0; i < leaderCount; i++) {
            for (uint8 j = i + 1; j < leaderCount; j++) {
                if (leaderboard[j].biggestWin > leaderboard[i].biggestWin) {
                    LeaderEntry memory temp = leaderboard[i];
                    leaderboard[i] = leaderboard[j];
                    leaderboard[j] = temp;
                }
            }
        }

        // Find player's rank and emit
        for (uint8 i = 0; i < leaderCount; i++) {
            if (leaderboard[i].player == player) {
                emit LeaderboardUpdated(player, biggestWin, biggestMult, i + 1);
                break;
            }
        }
    }

    // ═══ VIEWS ═══

    function getLeaderboard() external view returns (LeaderEntry[10] memory) {
        return leaderboard;
    }

    function getPlayerStats(address player) external view returns (PlayerStats memory) {
        return playerStats[player];
    }
}
