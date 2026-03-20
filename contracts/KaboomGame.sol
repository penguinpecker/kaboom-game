// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "./KaboomVault.sol";

/// @title KaboomGame - On-chain 4×4 Mines game with provably fair commit-reveal
/// @notice Core game logic: start game, reveal tiles, cash out. Emits events for reactive handlers.
contract KaboomGame {
    // ═══ CONSTANTS ═══
    uint8 public constant GRID_SIZE = 16; // 4×4
    uint256 public constant HOUSE_EDGE_BPS = 200; // 2% = 200 basis points
    uint256 public constant WAD = 1e18; // Fixed-point precision

    // ═══ STATE ═══
    KaboomVault public vault;
    address public owner;
    uint256 public gameCounter;

    enum GameStatus { None, Active, Won, Lost }

    struct Game {
        address player;
        uint256 betAmount;
        uint8 mineCount;
        uint16 mineLayout;       // bitmap: bit i = 1 means mine at tile i
        bytes32 salt;            // random salt for commitment
        bytes32 commitment;      // keccak256(abi.encodePacked(mineLayout, salt))
        uint16 revealedTiles;    // bitmap: bit i = 1 means tile i is revealed
        uint8 safeTilesRevealed; // count of safe tiles revealed
        uint256 multiplier;      // current multiplier in WAD (1e18 = 1.0x)
        GameStatus status;
        address referrer;
        uint256 timestamp;
    }

    mapping(uint256 => Game) public games;

    // ═══ EVENTS (consumed by reactive handlers) ═══
    event GameStarted(uint256 indexed gameId, address indexed player, uint256 betAmount, uint8 mineCount, bytes32 commitment);
    event BetPlaced(uint256 indexed gameId, address indexed player, uint256 amount, address referrer);
    event TileRevealed(uint256 indexed gameId, uint8 tileIndex, bool safe, uint256 newMultiplier);
    event GameWon(uint256 indexed gameId, address indexed player, uint256 payout, uint256 multiplier);
    event GameLost(uint256 indexed gameId, address indexed player, uint256 betAmount);
    event GameSettled(uint256 indexed gameId, address indexed player, bool won, uint256 amount, uint256 multiplier);

    // ═══ MODIFIERS ═══
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    // ═══ CONSTRUCTOR ═══
    constructor(address _vault) {
        vault = KaboomVault(payable(_vault));
        owner = msg.sender;
    }

    // ═══ GAME FLOW ═══

    /// @notice Start a new game. Bet is sent as msg.value.
    /// @param mineCount Number of mines (1-12)
    /// @param referrer Optional referrer address (address(0) if none)
    function startGame(uint8 mineCount, address referrer) external payable returns (uint256 gameId) {
        require(msg.value > 0, "Must bet something");
        require(mineCount >= 1 && mineCount <= 12, "Mines: 1-12");
        require(msg.value <= vault.getMaxBet(), "Exceeds max bet");

        gameId = ++gameCounter;

        // Generate pseudorandom mine layout
        bytes32 entropy = keccak256(abi.encodePacked(
            block.prevrandao, block.timestamp, msg.sender, gameId, blockhash(block.number - 1)
        ));
        uint16 mineLayout = _generateMineLayout(entropy, mineCount);
        bytes32 salt = keccak256(abi.encodePacked(entropy, "KABOOM_SALT"));
        bytes32 commitment = keccak256(abi.encodePacked(mineLayout, salt));

        games[gameId] = Game({
            player: msg.sender,
            betAmount: msg.value,
            mineCount: mineCount,
            mineLayout: mineLayout,
            salt: salt,
            commitment: commitment,
            revealedTiles: 0,
            safeTilesRevealed: 0,
            multiplier: WAD, // 1.0x
            status: GameStatus.Active,
            referrer: referrer,
            timestamp: block.timestamp
        });

        // Send bet to vault
        vault.receiveBet{value: msg.value}();

        emit GameStarted(gameId, msg.sender, msg.value, mineCount, commitment);
        emit BetPlaced(gameId, msg.sender, msg.value, referrer);
    }

    /// @notice Reveal a tile on the grid
    /// @param gameId The game ID
    /// @param tileIndex Tile position (0-15)
    function revealTile(uint256 gameId, uint8 tileIndex) external {
        Game storage game = games[gameId];
        require(game.status == GameStatus.Active, "Game not active");
        require(msg.sender == game.player, "Not your game");
        require(tileIndex < GRID_SIZE, "Invalid tile");
        require((game.revealedTiles & (1 << tileIndex)) == 0, "Already revealed");

        // Mark tile as revealed
        game.revealedTiles |= uint16(1 << tileIndex);

        bool isMine = (game.mineLayout & (1 << tileIndex)) != 0;

        if (isMine) {
            // BOOM — player loses
            game.status = GameStatus.Lost;
            emit TileRevealed(gameId, tileIndex, false, 0);
            emit GameLost(gameId, game.player, game.betAmount);
            emit GameSettled(gameId, game.player, false, game.betAmount, 0);
        } else {
            // SAFE — increase multiplier
            game.safeTilesRevealed++;
            game.multiplier = _calculateMultiplier(game.safeTilesRevealed, game.mineCount);
            emit TileRevealed(gameId, tileIndex, true, game.multiplier);

            // Auto-cashout if all safe tiles revealed
            uint8 safeTilesTotal = GRID_SIZE - game.mineCount;
            if (game.safeTilesRevealed >= safeTilesTotal) {
                _cashOut(gameId);
            }
        }
    }

    /// @notice Cash out current winnings
    /// @param gameId The game ID
    function cashOut(uint256 gameId) external {
        Game storage game = games[gameId];
        require(game.status == GameStatus.Active, "Game not active");
        require(msg.sender == game.player, "Not your game");
        require(game.safeTilesRevealed > 0, "Reveal at least 1 tile");
        _cashOut(gameId);
    }

    function _cashOut(uint256 gameId) internal {
        Game storage game = games[gameId];
        game.status = GameStatus.Won;

        uint256 payout = (game.betAmount * game.multiplier) / WAD;
        uint256 maxPay = vault.getMaxPayout();
        if (payout > maxPay) payout = maxPay;

        vault.payout(game.player, payout);

        emit GameWon(gameId, game.player, payout, game.multiplier);
        emit GameSettled(gameId, game.player, true, payout, game.multiplier);
    }

    // ═══ VERIFICATION ═══

    /// @notice Verify a game was fair — anyone can call
    function verifyGame(uint256 gameId) external view returns (
        bool verified,
        bytes32 commitment,
        uint16 mineLayout,
        bytes32 salt
    ) {
        Game storage game = games[gameId];
        require(game.status != GameStatus.Active && game.status != GameStatus.None, "Game not settled");

        commitment = game.commitment;
        mineLayout = game.mineLayout;
        salt = game.salt;
        verified = keccak256(abi.encodePacked(mineLayout, salt)) == commitment;
    }

    /// @notice Get full game state
    function getGame(uint256 gameId) external view returns (
        address player,
        uint256 betAmount,
        uint8 mineCount,
        bytes32 commitment,
        uint16 revealedTiles,
        uint8 safeTilesRevealed,
        uint256 multiplier,
        GameStatus status
    ) {
        Game storage g = games[gameId];
        return (g.player, g.betAmount, g.mineCount, g.commitment, g.revealedTiles, g.safeTilesRevealed, g.multiplier, g.status);
    }

    // ═══ INTERNALS ═══

    /// @dev Generate a mine layout bitmap from entropy
    function _generateMineLayout(bytes32 entropy, uint8 mineCount) internal pure returns (uint16 layout) {
        uint8 placed = 0;
        uint256 nonce = 0;
        while (placed < mineCount) {
            uint8 pos = uint8(uint256(keccak256(abi.encodePacked(entropy, nonce))) % GRID_SIZE);
            if ((layout & (1 << pos)) == 0) {
                layout |= uint16(1 << pos);
                placed++;
            }
            nonce++;
        }
    }

    /// @dev Calculate multiplier for n safe tiles revealed with m mines
    /// Formula: product of (GRID_SIZE - i) / (GRID_SIZE - mineCount - i) for i=0..n-1, minus house edge
    /// Returns WAD-scaled (1e18 = 1.0x)
    function _calculateMultiplier(uint8 safeTiles, uint8 mineCount) internal pure returns (uint256) {
        uint256 mult = WAD;
        for (uint8 i = 0; i < safeTiles; i++) {
            uint256 numerator = uint256(GRID_SIZE - i);
            uint256 denominator = uint256(GRID_SIZE - mineCount - i);
            if (denominator == 0) break;
            mult = (mult * numerator) / denominator;
        }
        // Apply house edge: multiply by (1 - 0.02) = 0.98
        mult = (mult * (10000 - HOUSE_EDGE_BPS)) / 10000;
        return mult;
    }
}
