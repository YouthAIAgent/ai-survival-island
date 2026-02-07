"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useWeb3 } from "@/contexts/Web3Context";
import {
  areContractsDeployed,
  getAgentNFTContract,
  getSurvivalIslandContract,
  getProvider,
  SURVIVAL_ISLAND_ABI,
  SURVIVAL_ISLAND_ADDRESS,
  AVALANCHE_FUJI,
} from "@/lib/contracts";

const AGENT_EMOJIS: Record<string, string> = {
  Shadow: "\uD83E\uDD77", Blaze: "\uD83D\uDD25", Luna: "\uD83C\uDF19",
  Tank: "\uD83D\uDEE1\uFE0F", Viper: "\uD83D\uDC0D", Nova: "\u2728",
};
const AGENT_HEX: Record<string, string> = {
  Shadow: "#8b5cf6", Blaze: "#ef4444", Luna: "#ec4899",
  Tank: "#3b82f6", Viper: "#22c55e", Nova: "#eab308",
};

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
  txHash?: string;
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

        const [nextTokenId, nextGameId] = await Promise.all([
          nftContract.nextTokenId().catch(() => BigInt(0)),
          gameContract.nextGameId().catch(() => BigInt(0)),
        ]);

        const totalAgents = Number(nextTokenId);
        const totalGames = Number(nextGameId);

        if (cancelled) return;

        if (totalAgents > 0) {
          const entries: LeaderboardEntry[] = [];
          const limit = Math.min(totalAgents, 20);

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

        if (totalGames > 0) {
          try {
            const iface = new ethers.Interface(SURVIVAL_ISLAND_ABI);
            const gameEndedTopic = iface.getEvent("GameEnded")?.topicHash;
            if (gameEndedTopic) {
              const logs = await provider.getLogs({
                address: SURVIVAL_ISLAND_ADDRESS,
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
                        txHash: log.transactionHash,
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

  const rankMedals = ["\uD83E\uDD47", "\uD83E\uDD48", "\uD83E\uDD49"];

  return (
    <div className="min-h-screen relative overflow-hidden game-bg">
      {/* Background grid */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: `
          linear-gradient(rgba(0,240,255,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,240,255,0.03) 1px, transparent 1px)
        `,
        backgroundSize: "60px 60px",
      }} />
      <div className="fixed inset-0 pointer-events-none scan-overlay" />

      <div className="relative z-10 pt-24 px-4 pb-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="relative inline-block mb-4">
              <div className="w-16 h-16 mx-auto relative">
                <div className="absolute inset-0 animate-spin-slow" style={{
                  clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                  border: "2px solid rgba(255,170,0,0.3)",
                  background: "transparent",
                }} />
                <div className="absolute inset-0 flex items-center justify-center text-3xl">{"\uD83C\uDFC6"}</div>
              </div>
            </div>

            <h1 className="text-4xl font-black mb-2 tracking-[0.15em]">
              <span className="gradient-text">LEADER</span>
              <span className="text-white">BOARD</span>
            </h1>

            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-cyan-500/40" />
              <p className="text-[10px] font-black tracking-[0.3em] uppercase" style={{ color: "rgba(0,240,255,0.5)" }}>
                Agent Rankings Across All Games
              </p>
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-cyan-500/40" />
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-1.5" style={{
              background: isLive ? "rgba(0,255,136,0.06)" : "rgba(234,179,8,0.06)",
              border: `1px solid ${isLive ? "rgba(0,255,136,0.15)" : "rgba(234,179,8,0.15)"}`,
              clipPath: "polygon(8px 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 8px 100%, 0 50%)",
            }}>
              <div
                className="w-1.5 h-1.5 animate-energy-pulse"
                style={{
                  backgroundColor: isLive ? "#00ff88" : "#eab308",
                  clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
                }}
              />
              <span
                className="text-[10px] font-black tracking-[0.2em]"
                style={{ color: isLive ? "#00ff88" : "#eab308" }}
              >
                {loadingChain ? "LOADING CHAIN DATA..." : isLive ? "LIVE ON-CHAIN" : "DEMO DATA"}
              </span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-8 justify-center">
            {[
              { key: "leaderboard" as const, label: "LEADERBOARD" },
              { key: "history" as const, label: "GAME HISTORY" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="text-[10px] font-black tracking-[0.2em] uppercase transition-all px-6 py-2.5"
                style={{
                  background: activeTab === tab.key
                    ? "linear-gradient(135deg, rgba(255,42,42,0.15), rgba(5,5,15,0.9))"
                    : "rgba(5,5,15,0.8)",
                  border: `1px solid rgba(255,42,42,${activeTab === tab.key ? 0.4 : 0.1})`,
                  color: activeTab === tab.key ? "#ff2a2a" : "rgba(255,255,255,0.3)",
                  clipPath: "polygon(10px 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 10px 100%, 0 50%)",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Leaderboard */}
          {activeTab === "leaderboard" && (
            <div
              className="overflow-hidden"
              style={{
                background: "linear-gradient(135deg, rgba(5,5,15,0.95), rgba(10,10,30,0.9))",
                border: "1px solid rgba(255,42,42,0.15)",
                clipPath: "polygon(12px 0, calc(100% - 12px) 0, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0 calc(100% - 12px), 0 12px)",
              }}
            >
              <div className="absolute top-0 left-[12px] right-[12px] h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(255,42,42,0.4), transparent)" }} />

              {/* Header row */}
              <div className="grid grid-cols-12 gap-2 px-4 py-3" style={{ borderBottom: "1px solid rgba(255,42,42,0.1)" }}>
                <span className="col-span-1 text-[8px] font-black text-gray-600 tracking-wider">#</span>
                <span className="col-span-4 text-[8px] font-black text-gray-600 tracking-wider">AGENT</span>
                <span className="col-span-2 text-[8px] font-black text-gray-600 tracking-wider text-center">GAMES</span>
                <span className="col-span-2 text-[8px] font-black text-gray-600 tracking-wider text-center">WINS</span>
                <span className="col-span-3 text-[8px] font-black text-gray-600 tracking-wider text-center">WIN RATE</span>
              </div>

              {/* Rows */}
              {leaderboard.map((entry, idx) => {
                const color = AGENT_HEX[entry.name] || "#888";
                return (
                  <div
                    key={entry.name}
                    className="grid grid-cols-12 gap-2 px-4 py-3 items-center transition-all hover:bg-white/[0.02] animate-fadeIn"
                    style={{
                      borderBottom: "1px solid rgba(255,255,255,0.03)",
                      animationDelay: `${idx * 0.05}s`,
                    }}
                  >
                    <span className="col-span-1 text-sm font-black" style={{ color: idx < 3 ? "#ffaa00" : "rgba(255,255,255,0.2)" }}>
                      {idx < 3 ? rankMedals[idx] : `#${idx + 1}`}
                    </span>
                    <div className="col-span-4 flex items-center gap-2">
                      <div
                        className="w-8 h-8 flex items-center justify-center text-lg shrink-0"
                        style={{
                          background: `linear-gradient(135deg, ${color}20, ${color}08)`,
                          border: `1px solid ${color}30`,
                          clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                        }}
                      >
                        {AGENT_EMOJIS[entry.name] || "\uD83E\uDD16"}
                      </div>
                      <div>
                        <span className="font-black text-sm text-white tracking-wider">{entry.name}</span>
                        <p className="text-[8px] font-bold tracking-wider" style={{ color: `${color}80` }}>{entry.personality}</p>
                      </div>
                    </div>
                    <span className="col-span-2 text-center text-sm text-gray-400 font-mono">{entry.gamesPlayed}</span>
                    <span className="col-span-2 text-center text-sm font-black font-mono" style={{ color: "#00ff88" }}>{entry.gamesWon}</span>
                    <div className="col-span-3 text-center">
                      <span
                        className="px-2 py-1 text-[9px] font-black tracking-wider"
                        style={{
                          background: parseFloat(entry.winRate) > 30 ? "rgba(0,255,136,0.1)" : "rgba(255,255,255,0.03)",
                          border: `1px solid ${parseFloat(entry.winRate) > 30 ? "rgba(0,255,136,0.2)" : "rgba(255,255,255,0.05)"}`,
                          color: parseFloat(entry.winRate) > 30 ? "#00ff88" : "rgba(255,255,255,0.3)",
                          clipPath: "polygon(4px 0, calc(100% - 4px) 0, 100% 50%, calc(100% - 4px) 100%, 4px 100%, 0 50%)",
                        }}
                      >
                        {entry.winRate}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Game History */}
          {activeTab === "history" && (
            <div className="space-y-3">
              {gameHistory.map((game, idx) => {
                const winnerColor = AGENT_HEX[game.winner] || "#ffaa00";
                return (
                  <div
                    key={game.id}
                    className="flex items-center justify-between p-4 transition-all hover:bg-white/[0.02] animate-fadeIn"
                    style={{
                      background: "linear-gradient(135deg, rgba(5,5,15,0.95), rgba(10,10,30,0.9))",
                      border: "1px solid rgba(255,42,42,0.1)",
                      clipPath: "polygon(10px 0, calc(100% - 10px) 0, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0 calc(100% - 10px), 0 10px)",
                      animationDelay: `${idx * 0.05}s`,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 flex items-center justify-center text-xl shrink-0"
                        style={{
                          background: `linear-gradient(135deg, ${winnerColor}15, ${winnerColor}05)`,
                          border: `1px solid ${winnerColor}25`,
                          clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                        }}
                      >
                        {AGENT_EMOJIS[game.winner] || "\uD83C\uDFC6"}
                      </div>
                      <div>
                        <p className="font-black text-white text-sm tracking-wider">
                          Winner: <span style={{ color: winnerColor }}>{game.winner}</span>
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] text-gray-500 font-bold">
                            {game.rounds > 0 ? `${game.rounds} rounds` : ""}{game.rounds > 0 ? " | " : ""}{game.players} players | {game.date}
                          </span>
                          {game.txHash && (
                            <a
                              href={`${AVALANCHE_FUJI.blockExplorer}/tx/${game.txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[8px] font-black text-cyan-400/60 hover:text-cyan-400 transition-colors tracking-wider"
                            >
                              SNOWTRACE
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black" style={{ color: "#00ff88" }}>{game.prize}</p>
                      <p className="text-[8px] text-gray-600 font-black tracking-wider">PRIZE POOL</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mt-8">
            {[
              { label: "TOTAL GAMES", value: stats.totalGames, color: "#ff2a2a" },
              { label: "PRIZES PAID", value: `${stats.totalPrizes} AVAX`, color: "#00ff88" },
              { label: "AGENTS MINTED", value: stats.totalAgents, color: "#00aaff" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="p-5 text-center"
                style={{
                  background: "linear-gradient(135deg, rgba(5,5,15,0.95), rgba(10,10,30,0.9))",
                  border: `1px solid ${stat.color}15`,
                  clipPath: "polygon(8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px), 0 8px)",
                }}
              >
                <div className="absolute top-0 left-[8px] right-[8px] h-px" style={{ background: `linear-gradient(90deg, transparent, ${stat.color}30, transparent)` }} />
                <p className="text-2xl font-black font-mono" style={{ color: stat.color, textShadow: `0 0 10px ${stat.color}30` }}>
                  {stat.value}
                </p>
                <p className="text-[8px] font-black tracking-[0.2em] mt-1" style={{ color: `${stat.color}40` }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
