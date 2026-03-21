# 💣 KABOOM! — On-Chain Mines on Somnia

> Provably fair 4×4 Mines game with 5 autonomous reactive smart contracts. Zero backend. Built for the [Somnia Reactivity Mini Hackathon](https://dorahacks.io/hackathon/somnia-reactivity) on DoraHacks.

<div align="center">

```
██╗  ██╗ █████╗ ██████╗  ██████╗  ██████╗ ███╗   ███╗██╗
██║ ██╔╝██╔══██╗██╔══██╗██╔═══██╗██╔═══██╗████╗ ████║██║
█████╔╝ ███████║██████╔╝██║   ██║██║   ██║██╔████╔██║██║
██╔═██╗ ██╔══██║██╔══██╗██║   ██║██║   ██║██║╚██╔╝██║╚═╝
██║  ██╗██║  ██║██████╔╝╚██████╔╝╚██████╔╝██║ ╚═╝ ██║██╗
╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝  ╚═════╝  ╚═════╝╚═╝     ╚═╝╚═╝
```

**🔴 [Play Live](https://kaboom-game-eosin.vercel.app) · [Explorer](https://shannon-explorer.somnia.network/address/0x9b0A46e35FB743eD366077ce16C497eFeEd37E2F) · [DoraHacks Submission](https://dorahacks.io/hackathon/somnia-reactivity)**

![Somnia Testnet](https://img.shields.io/badge/Somnia-Testnet%2050312-blue?style=flat-square)
![Solidity](https://img.shields.io/badge/Solidity-0.8.30-363636?style=flat-square&logo=solidity)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

</div>

---

## 🎮 What is KABOOM!?

KABOOM! is a fully on-chain **Mines game** — think Minesweeper meets DeFi — deployed on Somnia Testnet. Players bet STT tokens, reveal tiles on a 4×4 grid, and cash out before hitting a mine. Every tile click is a real blockchain transaction. Every payout is instant. No backend, no server, no trust required.

What makes it unique: **6 smart contracts powered by Somnia's native Reactivity protocol**. When a game event fires, on-chain handler contracts automatically execute — rebalancing vault risk, updating the leaderboard, flagging whales — all without any off-chain infrastructure.

---

## 🕹️ Gameplay

```
┌─────┬─────┬─────┬─────┐
│  ?  │  ✓  │  ?  │  ?  │    ✓ = Safe tile (multiplier increases)
├─────┼─────┼─────┼─────┤    💣 = Mine (you lose your bet)
│  ?  │  ?  │ 💣  │  ?  │    ? = Unrevealed
├─────┼─────┼─────┼─────┤
│  ✓  │  ?  │  ?  │  ✓  │    Click tiles to reveal them.
├─────┼─────┼─────┼─────┤    Cash out at any time to lock
│  ?  │  ✓  │  ?  │  ?  │    in your winnings.
└─────┴─────┴─────┴─────┘
```

### How to Play

1. **Connect** — Log in with Google, email, or a wallet. Privy creates an embedded wallet automatically.
2. **Set your bet** — Choose your STT amount and mine density (1–12 mines on 16 tiles).
3. **Engage** — Click "ENGAGE BET" to start. The contract locks your bet and commits the mine layout on-chain.
4. **Reveal tiles** — Click any tile. Safe tiles increase your multiplier. Hitting a mine ends the game.
5. **Exit & Withdraw** — Cash out at any time to receive `bet × multiplier` in STT directly to your wallet.

### Multiplier Formula

The multiplier is calculated on-chain using hypergeometric probability, with a 2% house edge applied:

```
multiplier = ∏(i=0 to safeTiles-1) [ (16 - i) / (16 - mineCount - i) ] × 0.98
```

| Mines | 1 safe | 3 safe | 5 safe | 10 safe |
|-------|--------|--------|--------|---------|
| 1 | 1.04× | 1.12× | 1.21× | 1.47× |
| 3 | 1.16× | 1.52× | 2.01× | 4.90× |
| 5 | 1.25× | 1.89× | 2.91× | 12.5× |
| 12 | 3.92× | 19.6× | 130× | — |

---

## 🏗️ Architecture

```
                        ┌──────────────────────────────────┐
                        │        SOMNIA BLOCKCHAIN          │
                        │                                   │
  Player ──────────────▶│  KaboomGame.sol                  │
  (bet + tile clicks)   │  ┌─────────────────────────────┐ │
                        │  │ startGame(mineCount)         │ │
                        │  │ revealTile(gameId, index)    │ │
                        │  │ cashOut(gameId)              │ │──▶ KaboomVault.sol
                        │  └──────────┬──────────────────┘ │    (Treasury)
                        │             │ emits events         │
                        │    ┌────────▼──────────┐          │
                        │    │ Somnia Reactivity  │          │
                        │    │ (native validators)│          │
                        │    └────────┬──────────┘          │
                        │             │ auto-triggers        │
                        │    ┌────────▼──────────────────┐  │
                        │    │ Reactive Handler Contracts  │  │
                        │    │                            │  │
                        │    │ ReactiveRiskGuardian ──────┼──▶ adjusts vault limits
                        │    │ ReactiveLeaderboard ───────┼──▶ ranks players
                        │    │ ReactiveReferral ──────────┼──▶ credits referrers
                        │    │ ReactiveWhaleAlert ────────┼──▶ flags large bets
                        │    └───────────────────────────┘  │
                        └──────────────────────────────────┘
                                         ▲
                        Next.js Frontend ┘
                        (wagmi + Privy + viem)
```

---

## 📦 Smart Contracts

All contracts deployed on **Somnia Testnet (Chain ID 50312)**:

| Contract | Address | Purpose |
|----------|---------|---------|
| `KaboomGame` | [`0x9b0A46e3...`](https://shannon-explorer.somnia.network/address/0x9b0A46e35FB743eD366077ce16C497eFeEd37E2F) | Core game logic, commit-reveal fairness |
| `KaboomVault` | [`0x9c1aF3D3...`](https://shannon-explorer.somnia.network/address/0x9c1aF3D3741542019f3A3C6C33eD3638db07A18b) | Treasury — holds funds, pays out winners |
| `ReactiveRiskGuardian` | [`0x208C305F...`](https://shannon-explorer.somnia.network/address/0x208C305F9D1794461d7069be1003e7e979C38e3F) | Auto-adjusts bet limits on vault health |
| `ReactiveLeaderboard` | [`0x82F67Bec...`](https://shannon-explorer.somnia.network/address/0x82F67Bec332c7A49D73C8078bdD72A4E381968fd) | Auto-ranks players on every win |
| `ReactiveReferral` | [`0xb655A2d9...`](https://shannon-explorer.somnia.network/address/0xb655A2d9b4242CfBE33fB95F6aeD8AF2A387d3B1) | Auto-credits referrers on bets |
| `ReactiveWhaleAlert` | [`0x5CE39982...`](https://shannon-explorer.somnia.network/address/0x5CE39982b73BA6ba21d5B649CE61A283615F4A4E) | Flags bets >5% of vault, notifies Guardian |

---

## ⚡ Somnia Reactivity — 5 Live Subscriptions

Somnia's native Reactivity lets smart contracts subscribe to events from other contracts. When an event fires, Somnia validators automatically invoke the handler — no backend, no keeper bot, no Chainlink.

```
Event Emitter          Event                    Handler Contract
─────────────────────────────────────────────────────────────────
KaboomGame      ──▶  GameSettled          ──▶  ReactiveRiskGuardian
KaboomVault     ──▶  VaultBalanceChanged  ──▶  ReactiveRiskGuardian
KaboomGame      ──▶  GameWon              ──▶  ReactiveLeaderboard
KaboomGame      ──▶  BetPlaced            ──▶  ReactiveReferral
KaboomGame      ──▶  BetPlaced            ──▶  ReactiveWhaleAlert
```

### What Each Subscription Does

**🛡️ ReactiveRiskGuardian** (DeFi + Automation)
Subscribes to `GameSettled` and `VaultBalanceChanged`. Monitors vault health as a percentage of peak balance. If health drops below 70%, it tightens `maxBet` to 0.5%. Below 50%, emergency mode at 0.25%. Above 90%, restores normal limits at 1%. Calls `vault.setMaxBetPercent()` directly — zero human intervention.

**🏆 ReactiveLeaderboard** (Gaming)
Subscribes to `GameWon`. Maintains a fully on-chain top-10 leaderboard sorted by biggest win. Auto-updates player stats (total won, games played, biggest multiplier) on every win. Bubble sort over a 10-entry array — gas-cheap and fully autonomous.

**🔗 ReactiveReferral** (Onchain Tracker)
Subscribes to `BetPlaced`. Tracks referral activity on-chain. Every bet that includes a referrer address gets logged with the full bet context.

**🐋 ReactiveWhaleAlert** (Onchain Tracker)
Subscribes to `BetPlaced`. Calculates the bet as a percentage of vault balance. If a bet exceeds 5% of the vault, it fires `WhaleDetected`, stores the event on-chain, and notifies `ReactiveRiskGuardian` to tighten limits proactively.

---

## 🔐 Provably Fair

Every game uses a **commit-reveal scheme**:

```solidity
// On startGame — mine layout committed before player sees anything
bytes32 entropy    = keccak256(abi.encodePacked(block.prevrandao, block.timestamp, msg.sender, gameId, blockhash(block.number - 1)));
uint16 mineLayout  = _generateMineLayout(entropy, mineCount);
bytes32 salt       = keccak256(abi.encodePacked(entropy, "KABOOM_SALT"));
bytes32 commitment = keccak256(abi.encodePacked(mineLayout, salt));
// commitment is emitted and visible on-chain before any tile is revealed
```

Anyone can call `verifyGame(gameId)` after a game ends to confirm the mine layout matches the original commitment. The contract cannot change the layout mid-game — it's sealed in the commitment hash.

---

## 🏦 Vault Mechanics

The `KaboomVault` is a house-funded treasury. Key parameters:

| Parameter | Value | Description |
|-----------|-------|-------------|
| Max bet | 1% of vault | Dynamic — auto-adjusted by RiskGuardian |
| Max payout | 10% of vault | Hard ceiling to protect reserves |
| House edge | 2% | Applied to multiplier calculation |
| Emergency threshold | 50% of peak | Tightens to 0.25% max bet |
| Caution threshold | 70% of peak | Tightens to 0.5% max bet |
| Healthy threshold | 90% of peak | Restores to 1% max bet |

The vault balance is visible live on the homepage stats banner. The `ReactiveRiskGuardian` autonomously manages risk without any human intervention or off-chain bot.

---

## 🖥️ Frontend

Built with **Next.js 14** and deployed on Vercel at [kaboom-game-eosin.vercel.app](https://kaboom-game-eosin.vercel.app).

### Pages

| Page | Route | Description |
|------|-------|-------------|
| Home | `/` | Hero, live vault stats, how-it-works, reactive modules |
| Play | `/play` | 4×4 game grid, bet controls, multiplier tracker |
| Leaderboard | `/leaderboard` | On-chain top-10 rankings |
| Event Logs | `/logs` | Live game history from localStorage cache |
| Vault | `/vault` | Vault health, balance, risk level |

### Tech Stack

```
Frontend          Backend / Chain
─────────────     ───────────────────────
Next.js 14        Somnia Testnet (50312)
TypeScript        Solidity 0.8.30
Tailwind CSS      Hardhat
wagmi v3          @somnia-chain/reactivity
viem v2           keccak256 commit-reveal
@privy-io/wagmi   
Space Grotesk     
Material Symbols  
```

### Wallet

Authentication is handled by [Privy](https://privy.io). Users can log in with Google, email, or an existing wallet. Privy automatically creates an embedded wallet for new users with `showWalletUIs: false` — transactions are auto-signed with no popup confirmation, making the game feel instant.

---

## 🗂️ Project Structure

```
kaboom/
├── contracts/
│   ├── KaboomGame.sol              # Core game logic + commit-reveal
│   ├── KaboomVault.sol             # Treasury vault + dynamic bet limits
│   ├── ReactiveRiskGuardian.sol    # Autonomous vault risk management
│   ├── ReactiveLeaderboard.sol     # Auto-updating on-chain rankings
│   ├── ReactiveReferral.sol        # Auto-credit referral tracking
│   └── ReactiveWhaleAlert.sol      # Large bet detection + guardian notify
│
├── scripts/
│   ├── deploy.ts                   # Deploy all 6 contracts
│   ├── create-subscriptions.ts     # Register 5 reactive subscriptions
│   └── verify.ts                   # Verify contracts on explorer
│
├── src/
│   ├── app/                        # Next.js App Router pages
│   │   ├── page.tsx                # Home page
│   │   ├── play/                   # Game page
│   │   ├── leaderboard/            # Leaderboard page
│   │   ├── logs/                   # Event logs page
│   │   └── vault/                  # Vault stats page
│   │
│   ├── components/
│   │   ├── game/
│   │   │   ├── Grid.tsx            # 4×4 tile grid
│   │   │   ├── Tile.tsx            # Individual tile (optimistic UI)
│   │   │   └── BetControls.tsx     # Bet amount, mines, engage/cashout
│   │   ├── layout/
│   │   │   ├── Navbar.tsx          # Navigation + wallet status
│   │   │   ├── Footer.tsx
│   │   │   └── MobileDrawer.tsx
│   │   ├── modals/                 # Win, lose, wallet, settings modals
│   │   └── ui/
│   │       └── KaboomLogo.tsx      # Bomb SVG logo
│   │
│   ├── hooks/
│   │   ├── useGame.tsx             # Game state machine + tx logic
│   │   ├── useContracts.tsx        # wagmi read hooks for all contracts
│   │   ├── useGameHistory.tsx      # localStorage game history
│   │   ├── useModal.tsx
│   │   └── useToast.tsx
│   │
│   ├── lib/
│   │   ├── chain.ts                # Chain config + contract addresses
│   │   ├── abis.ts                 # All contract ABIs
│   │   └── utils.ts
│   │
│   └── providers/
│       └── Web3Provider.tsx        # Privy + wagmi + QueryClient setup
│
├── hardhat.config.ts
├── package.json
└── tsconfig.json
```

---

## 🚀 Running Locally

### Prerequisites

- Node.js 18+
- A Privy App ID (free at [privy.io](https://privy.io))

### Setup

```bash
# Clone
git clone https://github.com/penguinpecker/kaboom-game.git
cd kaboom-game

# Install
npm install

# Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The app connects to the already-deployed contracts on Somnia Testnet — no local chain needed. Get free STT from the [Somnia Faucet](https://testnet.somnia.network/).

### Deploy Contracts (optional — already live)

```bash
# Set env vars
export PRIVATE_KEY=0x...

# Deploy all 6 contracts
npx hardhat run scripts/deploy.ts --network somnia

# Create reactive subscriptions
npx ts-node scripts/create-subscriptions.ts
```

---

## 🌐 Somnia Network

| Parameter | Value |
|-----------|-------|
| Chain ID | 50312 |
| RPC | `https://dream-rpc.somnia.network` |
| Explorer | `https://shannon-explorer.somnia.network` |
| Native token | STT (testnet) |
| Block time | ~85ms |
| Finality | Sub-second |
| Gas price | 6 gwei (fixed) |
| TPS | 1,000,000+ |

Somnia's ~85ms block time and sub-second finality make every tile reveal feel near-instant. Gas is fixed at 6 gwei with no priority fee market, so every transaction costs the same regardless of network load.

---

## 🏆 Hackathon — Somnia Reactivity Mini Hackathon

This project was built for the [Somnia Reactivity Mini Hackathon](https://dorahacks.io/hackathon/somnia-reactivity) on DoraHacks. It demonstrates Somnia's native Reactivity across all 5 required hackathon categories:

| Category | Implementation |
|----------|---------------|
| 🎮 Gaming | ReactiveLeaderboard — auto-ranks players on GameWon |
| 💰 DeFi | ReactiveRiskGuardian — auto-adjusts vault bet limits on GameSettled |
| 📊 Analytics | Live vault stats + game history on the homepage |
| 🔍 Onchain Tracker | ReactiveWhaleAlert — flags bets >5% of vault |
| 🤖 Automation | ReactiveRiskGuardian — autonomous vault health management |

### Why KABOOM! Showcases Reactivity

Without Somnia Reactivity, a risk management system like ReactiveRiskGuardian would require an off-chain keeper bot polling the chain every few seconds. With Reactivity, the vault protects itself — the moment a game settles, validators automatically invoke the guardian. The entire system is autonomous, censorship-resistant, and requires zero ongoing maintenance.

---

## 📄 License

This project is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2026 penguinpecker

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🔗 Links

| Resource | URL |
|----------|-----|
| 🎮 Live App | [kaboom-game-eosin.vercel.app](https://kaboom-game-eosin.vercel.app) |
| 📜 KaboomGame Contract | [shannon-explorer.somnia.network/address/0x9b0A46e3...](https://shannon-explorer.somnia.network/address/0x9b0A46e35FB743eD366077ce16C497eFeEd37E2F) |
| 🏦 KaboomVault Contract | [shannon-explorer.somnia.network/address/0x9c1aF3D3...](https://shannon-explorer.somnia.network/address/0x9c1aF3D3741542019f3A3C6C33eD3638db07A18b) |
| 🏆 DoraHacks | [dorahacks.io/hackathon/somnia-reactivity](https://dorahacks.io/hackathon/somnia-reactivity) |
| 🌐 Somnia Docs | [docs.somnia.network](https://docs.somnia.network) |
| 🚰 STT Faucet | [testnet.somnia.network](https://testnet.somnia.network) |

---

<div align="center">
  <br/>
  Built with 💣 on Somnia Testnet · Chain 50312 · © 2026 KABOOM!
  <br/><br/>
  <i>"Every click is a transaction. Every bet is on-chain. Every payout is instant."</i>
</div>
