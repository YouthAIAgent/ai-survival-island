"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import AgentCard from "@/components/AgentCard";
import { useWeb3 } from "@/contexts/Web3Context";
import {
  areContractsDeployed,
  getAgentNFTContract,
  getSurvivalIslandContract,
  getProvider,
  SURVIVAL_ISLAND_ABI,
} from "@/lib/contracts";

interface LeaderboardEntry {
  name: string;
  personality: string;
  gamesPlayed: number;
  gamesWon: number;
  winRate: string;
  status: "alive" | "eliminated";
}

interface GameHistoryEntry {
  id: string;
  winner: string;
  rounds: number;
  players: number;
  prize: string;
  date: string;
}

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { name: "Luna", personality: "The Charmer", gamesPlayed: 12, gamesWon: 5, winRate: "41.7%", status: "alive" },
  { name: "Shadow", personality: "The Mastermind", gamesPlayed: 10, gamesWon: 4, winRate: "40.0%", status: "alive" },
  { name: "Viper", personality: "The Backstabber", gamesPlayed: 15, gamesWon: 5, winRate: "33.3%", status: "alive" },
  { name: "Nova", personality: "The Diplomat", gamesPlayed: 8, gamesWon: 2, winRate: "25.0%", status: "alive" },
  { name: "Blaze", personality: "The Hothead", gamesPlayed: 11, gamesWon: 2, winRate: "18.2%", status: "eliminated" },
  { name: "Tank", personality: "The Protector", gamesPlayed: 9, gamesWon: 1, winRate: "11.1%", status: "eliminated" },
];

const MOCK_HISTORY: GameHistoryEntry[] = [
  { id: "game_001", winner: "Luna", rounds: 5, players: 6, prize: "0.3 AVAX", date: "Feb 4, 2026" },
  { id: "game_002", winner: "Shadow", rounds: 4, players: 6, prize: "0.3 AVAX", date: "Feb 3, 2026" },
  { id: "game_003", winner: "Viper", rounds: 5, players: 6, prize: "0.3 AVAX", date: "Feb 2, 2026" },
];

export default function VotePage() {
  const [activeTab, setActiveTab] = useState<"leaderboard" | "history">("leaderboard");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(MOCK_LEADERBOARD);
  const [gameHistory, setGameHistory] = useState<GameHistoryEntry[]>(MOCK_HISTORY);
  const [stats, setStats] = useState({ totalGames: 42, totalPrizes: "12.6", totalAgents: 156 });
  const [isLive, setIsLive] = useState(false);
  const [loadingChain, setLoadingChain] = useState(false);

  const { isConnected } = useWeb3();
  const contractsDeployed = areContractsDeployed();

  useEffect(() => {
    if (!contractsDeployed) return;

    let cancelled = false;

    async function fetchOnChainData() {
      setLoadingChain(true);
      try {
        const provider = getProvider();
        const nftContract = getAgentNFTContract(provider);
        const gameContract = getSurvivalIslandContract(provider);

        // Fetch totals
        const [nextTokenId, nextGameId] = await Promise.all([
          nftContract.nextTokenId().catch(() => BigInt(0)),
          gameContract.nextGameId().catch(() => BigInt(0)),
        ]);

        const totalAgents = Number(nextTokenId);
        const totalGames = Number(nextGameId);

        if (cancelled) return;

        // Build leaderboard from on-chain agents
        if (totalAgents > 0) {
          const entries: LeaderboardEntry[] = [];
          const limit = Math.min(totalAgents, 20); // Cap at 20 agents

          for (let i = 0; i < limit; i++) {
            try {
              const [traits, played, won, alive] = await Promise.all([
                nftContract.getAgentTraits(i),
                nftContract.gamesPlayed(i).catch(() => BigInt(0)),
                nftContract.gamesWon(i).catch(() => BigInt(0)),
                nftContract.isAlive(i).catch(() => true),
              ]);

              const gp = Number(played);
              const gw = Number(won);
              entries.push({
                name: traits.name || `Agent #${i}`,
                personality: traits.personality || "Unknown",
                gamesPlayed: gp,
                gamesWon: gw,
                winRate: gp > 0 ? `${((gw / gp) * 100).toFixed(1)}%` : "0.0%",
                status: alive ? "alive" : "eliminated",
              });
            } catch {
              // Skip agents that fail to load
            }
          }

          if (!cancelled && entries.length > 0) {
            entries.sort((a, b) => b.gamesWon - a.gamesWon || parseFloat(b.winRate) - parseFloat(a.winRate));
            setLeaderboard(entries);
          }
        }

        // Fetch game history from GameEnded events
        if (totalGames > 0) {
          try {
            const iface = new ethers.Interface(SURVIVAL_ISLAND_ABI);
            const gameEndedTopic = iface.getEvent("GameEnded")?.topicHash;
            if (gameEndedTopic) {
              const logs = await provider.getLogs({
                address: await gameContract.getAddress(),
                topics: [gameEndedTopic],
                fromBlock: 0,
              });

              if (!cancelled && logs.length > 0) {
                const history: GameHistoryEntry[] = [];
                for (const log of logs.slice(-10).reverse()) {
                  try {
                    const parsed = iface.parseLog({ topics: [...log.topics], data: log.data });
                    if (parsed) {
                      const block = await provider.getBlock(log.blockNumber);
                      const date = block
                        ? new Date(block.timestamp * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                        : "Unknown";

                      history.push({
                        id: `game_${parsed.args.gameId.toString()}`,
                        winner: `Agent #${parsed.args.winnerId.toString()}`,
                        rounds: 0,
                        players: 6,
                        prize: `${ethers.formatEther(parsed.args.prize)} AVAX`,
                        date,
                      });
                    }
                  } catch {
                    // Skip unparseable logs
                  }
                }
                if (history.length > 0) {
                  setGameHistory(history);
                }
              }
            }
          } catch {
            // Keep mock history on failure
          }
        }

        if (!cancelled) {
          setStats({
            totalGames: totalGames > 0 ? totalGames : 42,
            totalPrizes: totalGames > 0 ? `${(totalGames * 0.3).toFixed(1)}` : "12.6",
            totalAgents: totalAgents > 0 ? totalAgents : 156,
          });
          setIsLive(true);
        }
      } catch {
        // Fallback to mock data
      }

      if (!cancelled) {
        setLoadingChain(false);
      }
    }

    fetchOnChainData();
    return () => { cancelled = true; };
  }, [contractsDeployed]);

  return (
    <div className="min-h-screen pt-24 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">🏆</div>
          <h1 className="text-3xl font-bold text-white mb-2">Leaderboard</h1>
          <p className="text-gray-400">
            See which agents dominate the island across all games
          </p>
          <div className="inline-flex items-center gap-2 mt-3 px-3 py-1 rounded-full bg-opacity-10 border"
            style={{
              backgroundColor: isLive ? "rgba(0,255,136,0.1)" : "rgba(234,179,8,0.1)",
              borderColor: isLive ? "rgba(0,255,136,0.2)" : "rgba(234,179,8,0.2)",
            }}
          >
            <div
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ backgroundColor: isLive ? "#00ff88" : "#eab308" }}
            />
            <span
              className="text-[10px] font-bold tracking-wider uppercase"
              style={{ color: isLive ? "#00ff88" : "#eab308" }}
            >
              {loadingChain ? "Loading Chain Data..." : isLive ? "Live On-Chain" : "Demo Data"}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 justify-center">
          <button
            onClick={() => setActiveTab("leaderboard")}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "leaderboard"
                ? "avax-gradient text-white"
                : "glass-card text-gray-400 hover:text-white"
            }`}
          >
            Leaderboard
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "history"
                ? "avax-gradient text-white"
                : "glass-card text-gray-400 hover:text-white"
            }`}
          >
            Game History
          </button>
        </div>

        {activeTab === "leaderboard" && (
          <div className="glass-card rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-4 px-6 text-sm text-gray-400 font-medium">Rank</th>
                  <th className="text-left py-4 px-6 text-sm text-gray-400 font-medium">Agent</th>
                  <th className="text-center py-4 px-6 text-sm text-gray-400 font-medium">Games</th>
                  <th className="text-center py-4 px-6 text-sm text-gray-400 font-medium">Wins</th>
                  <th className="text-center py-4 px-6 text-sm text-gray-400 font-medium">Win Rate</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, idx) => (
                  <tr
                    key={entry.name}
                    className="border-b border-gray-800/50 hover:bg-white/5 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <span
                        className={`text-lg font-bold ${
                          idx === 0
                            ? "text-yellow-400"
                            : idx === 1
                            ? "text-gray-300"
                            : idx === 2
                            ? "text-orange-400"
                            : "text-gray-500"
                        }`}
                      >
                        #{idx + 1}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div>
                        <span className="font-bold text-white">{entry.name}</span>
                        <span className="text-xs text-gray-400 ml-2">
                          {entry.personality}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center text-gray-300">
                      {entry.gamesPlayed}
                    </td>
                    <td className="py-4 px-6 text-center text-green-400 font-bold">
                      {entry.gamesWon}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span
                        className={`px-2 py-1 rounded text-xs font-bold ${
                          parseFloat(entry.winRate) > 30
                            ? "bg-green-900/50 text-green-400"
                            : "bg-gray-800 text-gray-400"
                        }`}
                      >
                        {entry.winRate}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "history" && (
          <div className="space-y-4">
            {gameHistory.map((game) => (
              <div key={game.id} className="glass-card rounded-xl p-5 flex items-center justify-between">
                <div>
                  <p className="font-bold text-white">
                    Winner: <span className="gradient-text">{game.winner}</span>
                  </p>
                  <p className="text-sm text-gray-400">
                    {game.rounds > 0 ? `${game.rounds} rounds | ` : ""}{game.players} players | {game.date}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-400">{game.prize}</p>
                  <p className="text-xs text-gray-500">Prize Pool</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-8">
          <div className="glass-card rounded-xl p-6 text-center">
            <p className="text-3xl font-bold text-white">{stats.totalGames}</p>
            <p className="text-sm text-gray-400">Total Games</p>
          </div>
          <div className="glass-card rounded-xl p-6 text-center">
            <p className="text-3xl font-bold text-green-400">{stats.totalPrizes} AVAX</p>
            <p className="text-sm text-gray-400">Total Prizes</p>
          </div>
          <div className="glass-card rounded-xl p-6 text-center">
            <p className="text-3xl font-bold text-red-400">{stats.totalAgents}</p>
            <p className="text-sm text-gray-400">Agents Minted</p>
          </div>
        </div>
      </div>
    </div>
  );
}
