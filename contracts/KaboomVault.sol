// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

/// @title KaboomVault - Treasury for the Kaboom! Mines game
/// @notice Holds house bankroll, enforces dynamic bet/payout limits
contract KaboomVault {
    // ═══ STATE ═══
    address public owner;
    address public gameContract;
    address public riskGuardian;

    uint256 public maxBetPercent = 100; // basis points: 100 = 1%
    uint256 public maxPayoutPercent = 1000; // basis points: 1000 = 10%
    uint256 public peakBalance;

    // ═══ EVENTS ═══
    event VaultFunded(address indexed funder, uint256 amount, uint256 newBalance);
    event PayoutSent(address indexed player, uint256 amount, uint256 newBalance);
    event VaultBalanceChanged(uint256 newBalance, uint256 peakBalance);
    event MaxBetPercentChanged(uint256 oldPercent, uint256 newPercent);
    event EmergencyWithdraw(address indexed to, uint256 amount);

    // ═══ MODIFIERS ═══
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyGame() {
        require(msg.sender == gameContract, "Only game contract");
        _;
    }

    modifier onlyRiskGuardian() {
        require(msg.sender == riskGuardian, "Only risk guardian");
        _;
    }

    // ═══ CONSTRUCTOR ═══
    constructor() {
        owner = msg.sender;
    }

    // ═══ CONFIGURATION ═══
    function setGameContract(address _game) external onlyOwner {
        gameContract = _game;
    }

    function setRiskGuardian(address _guardian) external onlyOwner {
        riskGuardian = _guardian;
    }

    // ═══ VAULT OPERATIONS ═══

    /// @notice Fund the vault (anyone can deposit)
    function deposit() external payable {
        require(msg.value > 0, "Must send STT");
        if (address(this).balance > peakBalance) {
            peakBalance = address(this).balance;
        }
        emit VaultFunded(msg.sender, msg.value, address(this).balance);
        emit VaultBalanceChanged(address(this).balance, peakBalance);
    }

    /// @notice Pay out winnings to a player (only callable by game contract)
    function payout(address player, uint256 amount) external onlyGame {
        require(amount <= address(this).balance, "Insufficient vault balance");
        require(amount <= getMaxPayout(), "Exceeds max payout");

        (bool sent, ) = payable(player).call{value: amount}("");
        require(sent, "Transfer failed");

        emit PayoutSent(player, amount, address(this).balance);
        emit VaultBalanceChanged(address(this).balance, peakBalance);
    }

    /// @notice Receive bet from game contract
    function receiveBet() external payable onlyGame {
        if (address(this).balance > peakBalance) {
            peakBalance = address(this).balance;
        }
        emit VaultBalanceChanged(address(this).balance, peakBalance);
    }

    // ═══ RISK MANAGEMENT ═══

    /// @notice Adjust max bet percent (only callable by ReactiveRiskGuardian)
    function setMaxBetPercent(uint256 _percent) external onlyRiskGuardian {
        require(_percent >= 10 && _percent <= 500, "Range: 0.1% to 5%");
        uint256 old = maxBetPercent;
        maxBetPercent = _percent;
        emit MaxBetPercentChanged(old, _percent);
    }

    // ═══ VIEWS ═══

    /// @notice Dynamic max bet based on vault balance
    function getMaxBet() external view returns (uint256) {
        return (address(this).balance * maxBetPercent) / 10000;
    }

    /// @notice Hard-capped max payout
    function getMaxPayout() public view returns (uint256) {
        return (address(this).balance * maxPayoutPercent) / 10000;
    }

    /// @notice Vault health as percentage of peak (0-100)
    function getHealthPercent() external view returns (uint256) {
        if (peakBalance == 0) return 100;
        return (address(this).balance * 100) / peakBalance;
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    // ═══ EMERGENCY ═══

    function emergencyWithdraw() external onlyOwner {
        uint256 bal = address(this).balance;
        (bool sent, ) = payable(owner).call{value: bal}("");
        require(sent, "Transfer failed");
        emit EmergencyWithdraw(owner, bal);
    }

    receive() external payable {
        if (address(this).balance > peakBalance) {
            peakBalance = address(this).balance;
        }
        emit VaultFunded(msg.sender, msg.value, address(this).balance);
        emit VaultBalanceChanged(address(this).balance, peakBalance);
    }
}
