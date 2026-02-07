import { ethers } from "ethers";

// Contract ABIs (minimal - key functions only)
export const AGENT_NFT_ABI = [
  "function mint(string calldata _name, string calldata _personality) external payable returns (uint256)",
  "function getAgentTraits(uint256 tokenId) external view returns (tuple(string name, uint8 charisma, uint8 strategy, uint8 loyalty, uint8 aggression, uint8 wit, string personality))",
  "function ownerOf(uint256 tokenId) external view returns (address)",
  "function balanceOf(address owner) external view returns (uint256)",
  "function totalSupply() external view returns (uint256)",
  "function nextTokenId() external view returns (uint256)",
  "function mintPrice() external view returns (uint256)",
  "function isAlive(uint256 tokenId) external view returns (bool)",
  "function gamesPlayed(uint256 tokenId) external view returns (uint256)",
  "function gamesWon(uint256 tokenId) external view returns (uint256)",
  "event AgentMinted(uint256 indexed tokenId, address indexed owner, string name, string personality)",
];

export const SURVIVAL_ISLAND_ABI = [
  "function createGame(uint256 _maxRounds) external returns (uint256)",
  "function registerAgent(uint256 gameId, uint256 agentId) external payable",
  "function startGame(uint256 gameId) external",
  "function startVoting(uint256 gameId) external",
  "function vote(uint256 gameId, uint256 targetAgentId) external",
  "function eliminateAndAdvance(uint256 gameId) external",
  "function whisper(uint256 gameId, uint256 agentId, string calldata message) external",
  "function getGameAgents(uint256 gameId) external view returns (uint256[])",
  "function getAliveAgents(uint256 gameId) external view returns (uint256[])",
  "function games(uint256 gameId) external view returns (uint256 gameId, uint8 state, uint256 prizePool, uint256 currentRound, uint256 maxRounds, uint256 registrationEnd, uint256 roundEnd, uint256 winnerId)",
  "function entryFee() external view returns (uint256)",
  "function nextGameId() external view returns (uint256)",
  "event GameCreated(uint256 indexed gameId, uint256 maxRounds)",
  "event AgentRegistered(uint256 indexed gameId, uint256 indexed agentId, address owner)",
  "event GameStarted(uint256 indexed gameId, uint256 agentCount)",
  "event VoteCast(uint256 indexed gameId, uint256 round, address voter, uint256 targetAgentId)",
  "event AgentEliminated(uint256 indexed gameId, uint256 round, uint256 agentId)",
  "event GameEnded(uint256 indexed gameId, uint256 winnerId, uint256 prize)",
];

// Contract addresses from env
export const AGENT_NFT_ADDRESS =
  process.env.NEXT_PUBLIC_AGENT_NFT_ADDRESS || "";
export const SURVIVAL_ISLAND_ADDRESS =
  process.env.NEXT_PUBLIC_SURVIVAL_ISLAND_ADDRESS || "";

export const AVALANCHE_FUJI = {
  chainId: 43113,
  name: "Avalanche Fuji Testnet",
  rpcUrl: "https://api.avax-test.network/ext/bc/C/rpc",
  blockExplorer: "https://testnet.snowtrace.io",
  nativeCurrency: {
    name: "AVAX",
    symbol: "AVAX",
    decimals: 18,
  },
};

export const AVALANCHE_MAINNET = {
  chainId: 43114,
  name: "Avalanche C-Chain",
  rpcUrl: "https://api.avax.network/ext/bc/C/rpc",
  blockExplorer: "https://snowtrace.io",
  nativeCurrency: {
    name: "AVAX",
    symbol: "AVAX",
    decimals: 18,
  },
};

export function getProvider() {
  if (typeof window !== "undefined" && (window as any).ethereum) {
    return new ethers.BrowserProvider((window as any).ethereum);
  }
  return new ethers.JsonRpcProvider(AVALANCHE_FUJI.rpcUrl);
}

export async function getSigner() {
  const provider = getProvider();
  if (provider instanceof ethers.BrowserProvider) {
    return provider.getSigner();
  }
  throw new Error("No wallet connected");
}

export function getAgentNFTContract(signerOrProvider: ethers.Signer | ethers.Provider) {
  return new ethers.Contract(AGENT_NFT_ADDRESS, AGENT_NFT_ABI, signerOrProvider);
}

export function getSurvivalIslandContract(signerOrProvider: ethers.Signer | ethers.Provider) {
  return new ethers.Contract(SURVIVAL_ISLAND_ADDRESS, SURVIVAL_ISLAND_ABI, signerOrProvider);
}

export function areContractsDeployed(): boolean {
  return !!AGENT_NFT_ADDRESS && !!SURVIVAL_ISLAND_ADDRESS;
}

export async function createGameOnChain(
  signer: ethers.Signer,
  maxRounds: number
): Promise<{ gameId: number; txHash: string } | null> {
  if (!SURVIVAL_ISLAND_ADDRESS) return null;

  const contract = getSurvivalIslandContract(signer);
  const tx = await contract.createGame(maxRounds);
  const receipt = await tx.wait();

  // Parse GameCreated event
  const iface = new ethers.Interface(SURVIVAL_ISLAND_ABI);
  for (const log of receipt.logs) {
    try {
      const parsed = iface.parseLog({ topics: [...log.topics], data: log.data });
      if (parsed && parsed.name === "GameCreated") {
        return {
          gameId: Number(parsed.args.gameId),
          txHash: tx.hash,
        };
      }
    } catch {
      // Not our event, skip
    }
  }

  return { gameId: 0, txHash: tx.hash };
}

export function getExplorerTxUrl(hash: string): string {
  return `${AVALANCHE_FUJI.blockExplorer}/tx/${hash}`;
}

export function getExplorerAddressUrl(addr: string): string {
  return `${AVALANCHE_FUJI.blockExplorer}/address/${addr}`;
}

export async function switchToAvalancheFuji() {
  if (typeof window === "undefined" || !(window as any).ethereum) return;

  try {
    await (window as any).ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0xA869" }],
    });
  } catch (switchError: any) {
    if (switchError.code === 4902) {
      await (window as any).ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: "0xA869",
            chainName: AVALANCHE_FUJI.name,
            nativeCurrency: AVALANCHE_FUJI.nativeCurrency,
            rpcUrls: [AVALANCHE_FUJI.rpcUrl],
            blockExplorerUrls: [AVALANCHE_FUJI.blockExplorer],
          },
        ],
      });
    }
  }
}
