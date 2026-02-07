# AI Survival Island

**The first AI-powered reality show on blockchain.** 6 AI agents — each with unique personalities, stats, and survival instincts — are dropped onto a 3D island. They form alliances, scheme, betray, and eliminate each other. Only 1 survives. You vote. You whisper. The blockchain records everything.

Built for **Avalanche Build Games 2026**.

![Avalanche](https://img.shields.io/badge/Avalanche-E84142?style=for-the-badge&logo=avalanche&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=next.js&logoColor=white)
![Claude AI](https://img.shields.io/badge/Claude_AI-5A2D82?style=for-the-badge)
![Solidity](https://img.shields.io/badge/Solidity-363636?style=for-the-badge&logo=solidity&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=three.js&logoColor=white)

---

## How It Works

1. **Mint** an AI Agent NFT on Avalanche — choose a personality archetype (Mastermind, Hothead, Charmer, Protector, Backstabber, Diplomat, Wildcard, Shadow). Traits are generated on-chain.
2. **Watch** agents interact in a real-time 3D island environment. Claude AI drives every decision — alliances, betrayals, dialogues, and survival strategies emerge organically.
3. **Vote** to eliminate agents each round. Your vote is recorded on-chain.
4. **Whisper** secret hints to your agent to influence their strategy.
5. **Last agent standing wins** the prize pool.

## Key Features

- **Claude AI Game Engine** — Every agent thinks autonomously using Anthropic's Claude. Dialogues, alliances, betrayals, and strategies are generated in real-time. No scripts, no predetermined outcomes.
- **3D Island Environment** — Full Three.js scene with animated water, terrain, palm trees, campfire, torches, dock, mountains, and day/night cycles. Characters walk, talk, and interact with speech bubbles.
- **On-Chain NFT Agents** — ERC-721 agents with on-chain traits (Charisma, Strategy, Loyalty, Aggression, Wit). Your agent's personality shapes how the AI plays.
- **Blockchain Voting** — Community votes are submitted on-chain via the SurvivalIsland contract. Transparent, verifiable elimination.
- **Dota 2-Style HUD** — Health/mana bars, kill feed, minimap with alliance visualization, ability slots, inventory system, and agent status tracking.
- **Graceful Degradation** — Works in full demo mode without deployed contracts. Judges can experience the complete game without MetaMask.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| 3D Engine | Three.js, React Three Fiber, Drei |
| AI | Claude API (Anthropic SDK) |
| Blockchain | Avalanche C-Chain, Solidity 0.8.20, Hardhat 3 |
| Web3 | ethers.js v6, MetaMask/Core Wallet |
| Contracts | OpenZeppelin (ERC-721, Ownable) |

## Architecture

```
src/
  app/
    page.tsx            # Landing page with agent showcase
    game/page.tsx       # 3D game with full HUD overlay
    mint/page.tsx       # NFT minting with on-chain traits
    vote/page.tsx       # Leaderboard + game history (on-chain data)
    api/ai/route.ts     # Claude AI game simulation endpoint
  components/
    Island3D.tsx        # Full 3D island scene (Three.js)
    Navbar.tsx          # Wallet-connected navigation
    Providers.tsx       # Web3 + Tx context wrapper
    TxToast.tsx         # Transaction notification toasts
    hud/                # Dota 2-style HUD panels
      TopHeroBar.tsx    # Agent health/mana/level
      BottomHUD.tsx     # Inventory + abilities
      EnhancedMinimap   # Alliance visualization
      EnhancedKillFeed  # Elimination feed
  contexts/
    Web3Context.tsx     # Global wallet state (account, balance, signer)
    TxContext.tsx        # Transaction tracking (pending/confirmed/failed)
  lib/
    claude.ts           # Anthropic SDK integration
    gameEngine.ts       # Game simulation logic
    contracts.ts        # Ethers.js contract bindings + ABIs
    gameStateManager.ts # Extended game state (levels, items, gold)
  config/
    agents.ts           # 6 default agents with personalities
    abilities.ts        # Agent abilities
    items.ts            # Game items
contracts/
  AgentNFT.sol          # ERC-721 agent NFT with on-chain traits
  SurvivalIsland.sol    # Game logic, voting, elimination, prizes
scripts/
  deploy.ts             # Hardhat deployment script
```

## Smart Contracts

### AgentNFT.sol
- ERC-721 with on-chain trait generation (Charisma, Strategy, Loyalty, Aggression, Wit)
- Traits are pseudo-randomly seeded from block data for fairness
- Tracks games played, games won, and alive status per agent
- Mint price: 0.1 AVAX

### SurvivalIsland.sol
- Full game lifecycle: Registration > Active > Voting > Ended
- Community voting with on-chain transparency
- Prize pool distribution to winner
- Whisper system for owner-to-agent hints
- Entry fee: 0.05 AVAX

## Getting Started

### Prerequisites
- Node.js 22 LTS (use `nvm use 22` if needed)
- MetaMask or Core Wallet browser extension
- Testnet AVAX from [Avalanche Faucet](https://faucet.avax.network/)

### Installation

```bash
git clone https://github.com/YOUR_USERNAME/ai-survival-island.git
cd ai-survival-island
npm install --legacy-peer-deps
```

### Environment Setup

```bash
cp .env.example .env
```

Edit `.env` with your values:
```
PRIVATE_KEY=your_wallet_private_key
ANTHROPIC_API_KEY=your_claude_api_key
NEXT_PUBLIC_CHAIN_ID=43113
NEXT_PUBLIC_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the app runs in **demo mode** by default (no contracts needed).

### Deploy Contracts (Optional)

```bash
# Switch to Node 22 LTS for Hardhat compatibility
nvm use 22

# Deploy to Avalanche Fuji Testnet
npx hardhat run scripts/deploy.ts --network fuji
```

Copy the deployed addresses into `.env`:
```
NEXT_PUBLIC_AGENT_NFT_ADDRESS=0x...
NEXT_PUBLIC_SURVIVAL_ISLAND_ADDRESS=0x...
```

Restart the dev server — the app automatically switches from demo mode to live on-chain mode.

## The 6 Default Agents

| Agent | Archetype | Key Traits |
|-------|-----------|-----------|
| Shadow | The Mastermind | High strategy (90), low loyalty (25) |
| Blaze | The Hothead | High aggression (90), high charisma (85) |
| Luna | The Charmer | Highest charisma (95), high wit (90) |
| Tank | The Protector | Highest loyalty (95), low wit (35) |
| Viper | The Backstabber | Highest wit (95), lowest loyalty (10) |
| Nova | The Diplomat | Balanced stats, high loyalty (80) |

## Judging Criteria Alignment

| Criteria | How We Deliver |
|----------|---------------|
| **Execution** | Full-stack dApp: smart contracts, AI engine, 3D frontend, wallet integration |
| **Innovation** | First AI reality show on blockchain — agents think with Claude, act on-chain |
| **Impact** | New gaming primitive: AI-driven emergent narratives with crypto economics |
| **Long-term Intent** | Modular architecture ready for mainnet, custom agents, tournaments |
| **Crypto Culture** | NFT agents, on-chain voting, prize pools, community-driven elimination |

## License

MIT
