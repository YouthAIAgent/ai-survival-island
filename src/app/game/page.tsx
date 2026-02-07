"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import VotingPanel from "@/components/VotingPanel";
import ChatBubble from "@/components/ChatBubble";
import { DEFAULT_AGENTS } from "@/config/agents";
import { useWeb3 } from "@/contexts/Web3Context";
import { useTx } from "@/contexts/TxContext";
import { areContractsDeployed, getSurvivalIslandContract, createGameOnChain } from "@/lib/contracts";
import TopHeroBar from "@/components/hud/TopHeroBar";
import BottomHUD from "@/components/hud/BottomHUD";
import EnhancedMinimap from "@/components/hud/EnhancedMinimap";
import EnhancedKillFeed from "@/components/hud/EnhancedKillFeed";
import { initializeExtendedState, processRoundResults } from "@/lib/gameStateManager";
import type { ExtendedGameState, KillFeedEntry } from "@/types/gameTypes";
import type { GameEvent as EngineGameEvent, VoteTally } from "@/lib/gameEngine";

const Island3D = dynamic(() => import("@/components/Island3D"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#030306]">
      <div className="text-center">
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 border-2 border-cyan-500/30 animate-spin-slow" style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }} />
          <div className="absolute inset-2 border border-red-500/40 animate-spin-slow" style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)", animationDirection: "reverse" }} />
          <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-cyan-400/60 tracking-widest">LOAD</div>
        </div>
        <p className="text-cyan-500/50 font-black text-xs tracking-[0.3em] uppercase">Initializing 3D Environment</p>
      </div>
    </div>
  ),
});

const AGENT_EMOJIS: Record<string, string> = {
  Shadow: "\uD83E\uDD77", Blaze: "\uD83D\uDD25", Luna: "\uD83C\uDF19", Tank: "\uD83D\uDEE1\uFE0F", Viper: "\uD83D\uDC0D", Nova: "\u2728",
};
const AGENT_HEX: Record<string, string> = {
  Shadow: "#8b5cf6", Blaze: "#ef4444", Luna: "#ec4899",
  Tank: "#3b82f6", Viper: "#22c55e", Nova: "#eab308",
};

interface GameEvent { timestamp: number; round: number; type: string; agentName: string; content: string; target?: string; abilityUsed?: string; itemUsed?: string; }
interface GameState {
  gameId: string; round: number; status: "waiting" | "active" | "voting" | "ended";
  agents: { name: string; personality: string; charisma: number; strategy: number; loyalty: number; aggression: number; wit: number }[];
  aliveAgentNames: string[]; eliminatedAgentNames: string[]; events: GameEvent[]; narration: string; winner?: string;
  voteTally?: VoteTally;
}

export default function GamePage() {
  const [game, setGame] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [votedFor, setVotedFor] = useState<string>();
  const [onChainVoted, setOnChainVoted] = useState(false);
  const [myAgent] = useState("Shadow");
  const [loadingText, setLoadingText] = useState("AI Agents Thinking");
  const [showLog, setShowLog] = useState(false);
  const [showWhisper, setShowWhisper] = useState(false);

  // Phase 2: Round summary & vote results
  const [showRoundSummary, setShowRoundSummary] = useState(false);
  const [roundSummaryData, setRoundSummaryData] = useState<{ round: number; timeOfDay: string; events: GameEvent[]; narration: string; voteTally?: VoteTally } | null>(null);
  const [showVoteResults, setShowVoteResults] = useState(false);
  const [voteResultsData, setVoteResultsData] = useState<{ tally: VoteTally; playerVote: string } | null>(null);

  // Phase 2: Whisper toast & confirm dialog
  const [whisperToast, setWhisperToast] = useState<string | null>(null);
  const [showConfirmNewGame, setShowConfirmNewGame] = useState(false);

  // Phase 2: Immunity banner
  const [immunityBanner, setImmunityBanner] = useState<string | null>(null);

  // Phase 3: On-chain game ID & prize pool
  const [onChainGameId, setOnChainGameId] = useState<number | null>(null);
  const [prizePool, setPrizePool] = useState<string | null>(null);

  // Web3
  const { isConnected, signer } = useWeb3();
  const { addTx } = useTx();
  const contractsDeployed = areContractsDeployed();

  // Extended state
  const [extendedState, setExtendedState] = useState<ExtendedGameState | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<string | null>("Shadow");
  const [killFeedEntries, setKillFeedEntries] = useState<KillFeedEntry[]>([]);

  // Ref for checking if user is typing in an input
  const isTypingRef = useRef(false);

  useEffect(() => {
    if (!loading) return;
    const texts = ["AI Agents Thinking", "Agents Scheming", "Forming Alliances", "Plotting Betrayals", "Drama Unfolding"];
    let i = 0;
    const interval = setInterval(() => { i = (i + 1) % texts.length; setLoadingText(texts[i]); }, 2000);
    return () => clearInterval(interval);
  }, [loading]);

  // Phase 2: Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Skip when typing in input fields
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      switch (e.key.toLowerCase()) {
        case "q":
          setShowLog((prev) => !prev);
          break;
        case "w":
          setShowWhisper((prev) => !prev);
          break;
        case " ":
          e.preventDefault();
          if (game && !loading && game.status === "active") {
            simulateRoundAction();
          }
          break;
        case "escape":
          setShowLog(false);
          setShowWhisper(false);
          setShowRoundSummary(false);
          setShowVoteResults(false);
          setShowConfirmNewGame(false);
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [game, loading]);

  const apiCall = useCallback(async (body: Record<string, unknown>) => {
    const res = await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data.game as GameState;
  }, []);

  async function startNewGame() {
    // Phase 2: Confirm dialog if game is active
    if (game && game.status !== "ended" && !showConfirmNewGame) {
      setShowConfirmNewGame(true);
      return;
    }
    setShowConfirmNewGame(false);

    setLoading(true); setHasVoted(false); setShowLog(false);
    setShowRoundSummary(false); setShowVoteResults(false);
    setOnChainGameId(null); setPrizePool(null);
    try {
      const g = await apiCall({ action: "create_game", gameId: `game_${Date.now()}`, agents: DEFAULT_AGENTS });
      setGame(g);
      const ext = initializeExtendedState(g.agents.map((a) => a.name));
      setExtendedState(ext);
      setKillFeedEntries([]);
      setSelectedAgent("Shadow");

      // Phase 3: Attempt on-chain game creation
      if (contractsDeployed && isConnected && signer) {
        try {
          const result = await createGameOnChain(signer, 10);
          if (result) {
            setOnChainGameId(result.gameId);
            addTx(result.txHash, "Creating game on-chain...");
            // Fetch prize pool
            try {
              const contract = getSurvivalIslandContract(signer);
              const gameData = await contract.games(result.gameId);
              setPrizePool(gameData.prizePool ? (Number(gameData.prizePool) / 1e18).toFixed(3) : null);
            } catch { /* prize pool query failed */ }
          }
        } catch { /* on-chain creation failed, continue off-chain */ }
      }
    } catch (err: any) { alert("Error: " + err.message); }
    setLoading(false);
  }

  // Build mechanical states for Claude prompt
  function buildMechanicalStates(): Record<string, unknown> | undefined {
    if (!extendedState) return undefined;
    const states: Record<string, unknown> = {};
    for (const [name, state] of Object.entries(extendedState.agentStates)) {
      if (!state.isAlive) continue;
      const cooldowns: Record<string, number> = {};
      for (const ability of state.abilities) {
        cooldowns[ability.key] = ability.currentCooldown;
      }
      states[name] = {
        hp: state.hp,
        maxHp: state.maxHp,
        mana: state.mana,
        maxMana: state.maxMana,
        cooldowns,
        items: state.items.map((i) => i.name),
        statusEffects: state.statusEffects.map((se) => se.name),
      };
    }
    return states;
  }

  async function simulateRoundAction() {
    if (!game || !extendedState) return;
    setLoading(true); setHasVoted(false);
    setShowRoundSummary(false); setShowVoteResults(false);
    try {
      const mechanicalStates = buildMechanicalStates();
      const g = await apiCall({ action: "simulate_round", gameId: game.gameId, mechanicalStates });
      setGame(g);
      const roundEvents = g.events.filter((e) => e.round === g.round) as unknown as EngineGameEvent[];
      const { state: newState, killFeed } = processRoundResults(extendedState, roundEvents, g.aliveAgentNames, g.eliminatedAgentNames);
      setExtendedState(newState);
      setKillFeedEntries((prev) => [...prev, ...killFeed]);

      // Phase 2: Show round summary instead of jumping to vote
      setRoundSummaryData({
        round: g.round,
        timeOfDay: newState.timeOfDay,
        events: g.events.filter((e) => e.round === g.round),
        narration: g.narration,
        voteTally: g.voteTally,
      });
      setShowRoundSummary(true);
    } catch (err: any) { alert("Error: " + err.message); }
    setLoading(false);
  }

  async function handleVote(agentName: string) {
    if (!game || !extendedState) return;

    // Phase 1: Immunity check
    const targetState = extendedState.agentStates[agentName];
    if (targetState) {
      const immunityIdx = targetState.statusEffects.findIndex((se) => se.id === "immunity");
      if (immunityIdx >= 0) {
        // Remove immunity buff
        targetState.statusEffects.splice(immunityIdx, 1);
        setImmunityBanner(agentName);
        setTimeout(() => setImmunityBanner(null), 4000);
        // Skip elimination
        setHasVoted(true);
        setVotedFor(undefined);
        return;
      }
    }

    setLoading(true);
    setOnChainVoted(false);

    // Attempt on-chain vote (non-blocking)
    if (contractsDeployed && isConnected && signer) {
      try {
        const contract = getSurvivalIslandContract(signer);
        const agentIndex = game.agents.findIndex((a) => a.name === agentName);
        if (agentIndex >= 0) {
          const tx = await contract.vote(onChainGameId ?? 0, agentIndex);
          addTx(tx.hash, `Voting to eliminate ${agentName}...`);
          setOnChainVoted(true);
        }
      } catch {
        // On-chain vote failed — continue with off-chain
      }
    }

    try {
      const g = await apiCall({ action: "eliminate", gameId: game.gameId, agentName });
      setGame(g);
      setHasVoted(true);
      setVotedFor(agentName);

      // Phase 2: Show vote results overlay
      if (game.voteTally) {
        // Add player vote to tally
        const tally = { ...game.voteTally };
        if (tally[agentName]) {
          tally[agentName] = { votes: tally[agentName].votes + 1, voters: [...tally[agentName].voters, "You"] };
        }
        setVoteResultsData({ tally, playerVote: agentName });
        setShowVoteResults(true);
        setTimeout(() => setShowVoteResults(false), 4000);
      }

      const roundEvents = g.events.filter((e) => e.round === g.round) as unknown as EngineGameEvent[];
      const { state: newState, killFeed } = processRoundResults(extendedState, roundEvents, g.aliveAgentNames, g.eliminatedAgentNames);
      setExtendedState(newState);
      setKillFeedEntries((prev) => [...prev, ...killFeed]);
      if (agentName === selectedAgent) {
        const nextAlive = g.aliveAgentNames.find((n) => n !== agentName);
        if (nextAlive) setSelectedAgent(nextAlive);
      }
    } catch (err: any) { alert("Error: " + err.message); }
    setLoading(false);
  }

  async function handleWhisper(message: string) {
    // Attempt on-chain whisper (non-blocking)
    if (contractsDeployed && isConnected && signer && game) {
      try {
        const contract = getSurvivalIslandContract(signer);
        const agentIndex = game.agents.findIndex((a) => a.name === myAgent);
        if (agentIndex >= 0) {
          const tx = await contract.whisper(onChainGameId ?? 0, agentIndex, message);
          addTx(tx.hash, `Whispering to ${myAgent}...`);
        }
      } catch {
        // On-chain whisper failed — continue with off-chain
      }
    }
    // Phase 2: Toast instead of alert()
    setWhisperToast(`Whisper sent to ${myAgent}`);
    setTimeout(() => setWhisperToast(null), 3000);
    setShowWhisper(false);
  }

  // ======================== START SCREEN ========================
  if (!game) {
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

        {/* Scan line effect */}
        <div className="fixed inset-0 pointer-events-none scan-overlay" />

        <div className="relative z-10 pt-24 px-4 pb-12">
          {/* Logo section */}
          <div className="text-center mb-14">
            {/* Hexagonal emblem */}
            <div className="relative inline-block mb-8">
              <div className="w-28 h-28 mx-auto relative">
                <div className="absolute inset-0 animate-spin-slow" style={{
                  clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                  border: "2px solid rgba(0,240,255,0.3)",
                  background: "transparent",
                }} />
                <div className="absolute inset-2 animate-spin-slow" style={{
                  animationDirection: "reverse",
                  clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                  border: "1px solid rgba(255,42,42,0.3)",
                  background: "transparent",
                }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-5xl" style={{ filter: "drop-shadow(0 0 15px rgba(255,42,42,0.5))" }}>{"\uD83C\uDFDD\uFE0F"}</span>
                </div>
              </div>
              {/* Glow pulse behind */}
              <div className="absolute inset-0 -z-10 mx-auto w-28 h-28 animate-pulse-glow rounded-full" style={{ background: "radial-gradient(circle, rgba(255,42,42,0.15), transparent 70%)" }} />
            </div>

            <h1 className="text-5xl md:text-7xl font-black mb-3 animate-logo-reveal tracking-[0.15em]">
              <span className="gradient-text">SURVIVAL</span>
              <span className="text-white"> ISLAND</span>
            </h1>

            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="h-px w-16 bg-gradient-to-r from-transparent to-cyan-500/40" />
              <p className="text-sm font-black tracking-[0.3em] uppercase" style={{ color: "rgba(0,240,255,0.5)" }}>
                6 AI Agents Enter // 1 Survives
              </p>
              <div className="h-px w-16 bg-gradient-to-l from-transparent to-cyan-500/40" />
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-1.5" style={{
              background: "rgba(0,255,136,0.06)",
              border: "1px solid rgba(0,255,136,0.15)",
              clipPath: "polygon(8px 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 8px 100%, 0 50%)",
            }}>
              <div className="w-1.5 h-1.5 bg-green-400 animate-energy-pulse" style={{ clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }} />
              <span className="text-[10px] text-green-400 font-black tracking-[0.2em]">3D ENGINE ONLINE</span>
            </div>
          </div>

          {/* Agent cards grid */}
          <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-3 gap-3 mb-12">
            {DEFAULT_AGENTS.map((agent, idx) => {
              const color = AGENT_HEX[agent.name] || "#888";
              return (
                <div
                  key={agent.name}
                  className="group cursor-pointer transition-all duration-300 hover:scale-[1.03] animate-fadeInUp"
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <div
                    className="relative overflow-hidden p-4"
                    style={{
                      background: `linear-gradient(135deg, rgba(5,5,20,0.9), ${color}08)`,
                      border: `1px solid ${color}20`,
                      clipPath: "polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))",
                    }}
                  >
                    {/* Top accent line */}
                    <div className="absolute top-0 left-0 right-[14px] h-px" style={{ background: `linear-gradient(90deg, ${color}60, transparent)` }} />
                    {/* Right accent line */}
                    <div className="absolute top-[14px] right-0 bottom-0 w-px" style={{ background: `linear-gradient(180deg, ${color}60, transparent)` }} />

                    {/* Agent header */}
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-12 h-12 flex items-center justify-center text-2xl portrait-frame group-hover:scale-110 transition-transform"
                        style={{
                          background: `linear-gradient(135deg, ${color}25, ${color}08)`,
                          border: `1px solid ${color}40`,
                          boxShadow: `0 0 12px ${color}15`,
                        }}
                      >
                        {AGENT_EMOJIS[agent.name] || "\uD83E\uDD16"}
                      </div>
                      <div>
                        <h3 className="font-black text-white text-base tracking-wider uppercase">{agent.name}</h3>
                        <p className="text-[9px] font-bold tracking-wider uppercase" style={{ color }}>{agent.personality.split(" - ")[0]}</p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="space-y-1.5">
                      {[
                        { label: "CHA", value: agent.charisma, color: "#ec4899" },
                        { label: "STR", value: agent.strategy, color: "#3b82f6" },
                        { label: "LOY", value: agent.loyalty, color: "#22c55e" },
                        { label: "AGG", value: agent.aggression, color: "#ef4444" },
                        { label: "WIT", value: agent.wit, color: "#eab308" },
                      ].map((stat) => (
                        <div key={stat.label} className="flex items-center gap-2">
                          <span className="text-[8px] font-black tracking-wider w-6" style={{ color: stat.color + "80" }}>{stat.label}</span>
                          <div className="flex-1 h-[3px] bg-white/5 relative" style={{ clipPath: "polygon(0 0, calc(100% - 2px) 0, 100% 100%, 2px 100%)" }}>
                            <div
                              className="h-full transition-all duration-1000"
                              style={{
                                width: `${stat.value}%`,
                                background: `linear-gradient(90deg, ${stat.color}60, ${stat.color})`,
                                boxShadow: `0 0 4px ${stat.color}30`,
                              }}
                            />
                          </div>
                          <span className="text-[8px] font-mono font-bold w-5 text-right" style={{ color: stat.color + "60" }}>{stat.value}</span>
                        </div>
                      ))}
                    </div>

                    {/* Scan line */}
                    <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity scan-overlay" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Start button */}
          <div className="text-center">
            <button
              onClick={startNewGame}
              disabled={loading}
              className="group relative game-btn px-16 py-5 text-white text-xl disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                clipPath: "polygon(20px 0, calc(100% - 20px) 0, 100% 50%, calc(100% - 20px) 100%, 20px 100%, 0 50%)",
              }}
            >
              {loading ? (
                <span className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-white/40 border-t-white animate-spin" style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }} />
                  <span className="tracking-[0.2em]">INITIALIZING...</span>
                </span>
              ) : (
                <span className="tracking-[0.2em] flex items-center gap-3">
                  <span className="text-lg">{"\u25B6"}</span>
                  DEPLOY AGENTS
                </span>
              )}
            </button>

            <div className="mt-6 flex items-center justify-center gap-3">
              <div className="h-px w-8 bg-cyan-500/20" />
              <p className="text-[9px] font-black tracking-[0.3em] uppercase" style={{ color: "rgba(0,240,255,0.25)" }}>
                Powered by Claude AI // 3D Island Protocol
              </p>
              <div className="h-px w-8 bg-cyan-500/20" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ======================== ACTIVE GAME ========================
  const aliveAgents = game.agents.filter((a) => game.aliveAgentNames.includes(a.name));
  const roundEvents = game.events.filter((e) => e.round === game.round);

  const island3DAgents = game.agents.map((a) => ({
    name: a.name,
    isAlive: game.aliveAgentNames.includes(a.name),
  }));

  const selectedAgentState = extendedState && selectedAgent
    ? extendedState.agentStates[selectedAgent] || null
    : null;

  return (
    <div className="h-[calc(100vh-56px)] relative overflow-hidden">
      {/* 3D Island - Full Background */}
      <div className="absolute inset-0">
        <Island3D
          key={game.gameId}
          agents={island3DAgents}
          events={game.events}
          round={game.round}
          status={game.status}
          timeOfDay={extendedState?.timeOfDay}
          agentStates={extendedState?.agentStates}
        />
      </div>

      {/* ===== TOP HERO BAR ===== */}
      {extendedState && (
        <div className="absolute top-3 left-3 right-3 z-10">
          <TopHeroBar
            agentStates={extendedState.agentStates}
            selectedAgent={selectedAgent}
            onSelectAgent={setSelectedAgent}
            round={game.round}
            aliveCount={game.aliveAgentNames.length}
            timeOfDay={extendedState.timeOfDay}
            gameStatus={game.status}
          />
        </div>
      )}

      {/* ===== PRIZE POOL BADGE ===== */}
      {prizePool && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-10">
          <div className="px-3 py-1 flex items-center gap-2" style={{
            background: "rgba(0,255,136,0.08)",
            border: "1px solid rgba(0,255,136,0.2)",
            clipPath: "polygon(8px 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 8px 100%, 0 50%)",
          }}>
            <span className="text-[9px] font-black tracking-wider text-green-400">{prizePool} AVAX PRIZE POOL</span>
          </div>
        </div>
      )}

      {/* ===== LEFT: TOGGLE BUTTONS ===== */}
      <div className="absolute left-3 top-20 z-10 flex flex-col gap-1.5">
        {[
          { key: "log", active: showLog, toggle: () => setShowLog(!showLog), label: "LOG [Q]", color: "255,42,42", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
          { key: "whisper", active: showWhisper, toggle: () => setShowWhisper(!showWhisper), label: "COMM [W]", color: "180,74,255", icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" },
        ].map((btn) => (
          <button
            key={btn.key}
            onClick={btn.toggle}
            className="transition-all duration-200"
            style={{
              background: btn.active
                ? `linear-gradient(135deg, rgba(${btn.color},0.15), rgba(5,5,15,0.9))`
                : "rgba(5,5,15,0.8)",
              border: `1px solid rgba(${btn.color},${btn.active ? 0.4 : 0.1})`,
              padding: "6px 10px",
              clipPath: "polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))",
            }}
          >
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke={btn.active ? `rgba(${btn.color},1)` : "rgba(255,255,255,0.3)"} strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d={btn.icon} />
              </svg>
              <span className="text-[8px] font-black tracking-[0.15em]" style={{ color: btn.active ? `rgba(${btn.color},1)` : "rgba(255,255,255,0.3)" }}>
                {btn.label}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* ===== LEFT: EVENT LOG PANEL ===== */}
      {showLog && (
        <div
          className="absolute left-3 top-[140px] z-10 w-80 max-h-[35vh] overflow-y-auto custom-scrollbar animate-slide-in-left"
          style={{
            background: "linear-gradient(135deg, rgba(5,5,15,0.95), rgba(10,10,30,0.9))",
            border: "1px solid rgba(255,42,42,0.15)",
            clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))",
          }}
        >
          {/* Top energy line */}
          <div className="absolute top-0 left-0 right-[10px] h-px" style={{ background: "linear-gradient(90deg, rgba(255,42,42,0.6), transparent)" }} />

          <div className="sticky top-0 z-10 px-3 py-2" style={{ background: "rgba(5,5,15,0.95)", borderBottom: "1px solid rgba(255,42,42,0.1)" }}>
            <div className="flex items-center gap-2">
              <div className="w-1 h-1 bg-red-500 animate-energy-pulse" style={{ clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }} />
              <h3 className="text-[9px] font-black text-red-400/80 uppercase tracking-[0.2em]">Round {game.round} Intel</h3>
            </div>
          </div>

          <div className="p-2.5 space-y-1.5">
            {game.narration && (
              <div className="p-2.5" style={{
                background: "linear-gradient(135deg, rgba(255,170,0,0.06), rgba(5,5,15,0.8))",
                borderLeft: "2px solid rgba(255,170,0,0.4)",
              }}>
                <p className="text-[9px] text-yellow-300/80 italic leading-relaxed font-medium">{game.narration}</p>
              </div>
            )}
            {roundEvents.length === 0 && !game.narration && (
              <p className="text-[9px] text-gray-600 text-center py-6 font-mono tracking-wider">// NO DATA //</p>
            )}
            {roundEvents.map((event, i) => {
              const eventColors: Record<string, { bg: string; border: string; text: string }> = {
                dialogue: { bg: "rgba(59,130,246,0.06)", border: "rgba(59,130,246,0.4)", text: "#60a5fa" },
                action: { bg: "rgba(168,85,247,0.06)", border: "rgba(168,85,247,0.4)", text: "#a78bfa" },
                alliance: { bg: "rgba(34,197,94,0.06)", border: "rgba(34,197,94,0.4)", text: "#4ade80" },
                betrayal: { bg: "rgba(255,42,42,0.06)", border: "rgba(255,42,42,0.4)", text: "#f87171" },
                elimination: { bg: "rgba(255,42,42,0.1)", border: "rgba(255,42,42,0.6)", text: "#ef4444" },
              };
              const ec = eventColors[event.type] || { bg: "rgba(100,100,100,0.06)", border: "rgba(100,100,100,0.3)", text: "#9ca3af" };

              return (
                <div
                  key={i}
                  className="p-2 text-[9px] animate-fadeIn"
                  style={{
                    background: ec.bg,
                    borderLeft: `2px solid ${ec.border}`,
                    animationDelay: `${i * 0.05}s`,
                  }}
                >
                  <span className="font-black" style={{ color: AGENT_HEX[event.agentName] || ec.text }}>{event.agentName}</span>
                  {event.target && <span className="text-gray-600"> {"\u25B8"} <span style={{ color: AGENT_HEX[event.target] || "#888" }}>{event.target}</span></span>}
                  <p className="mt-0.5 text-gray-500 leading-relaxed">{event.content}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== RIGHT: WHISPER PANEL ===== */}
      {showWhisper && (
        <div
          className="absolute right-3 bottom-28 z-10 w-72 animate-slide-in-right"
          style={{
            background: "linear-gradient(135deg, rgba(5,5,15,0.95), rgba(15,5,20,0.9))",
            border: "1px solid rgba(180,74,255,0.2)",
            clipPath: "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)",
          }}
        >
          <div className="absolute top-0 left-[10px] right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(180,74,255,0.5))" }} />
          <div className="p-3">
            <ChatBubble agentName={myAgent} gameId={game.gameId} onWhisper={handleWhisper} />
          </div>
        </div>
      )}

      {/* ===== BOTTOM: HUD ===== */}
      <div className="absolute bottom-3 left-3 right-3 z-10">
        <BottomHUD
          agent={selectedAgentState}
          onSimulateRound={simulateRoundAction}
          onStartNewGame={startNewGame}
          loading={loading}
          loadingText={loadingText}
          gameStatus={game.status}
          nextRound={game.round + 1}
        />
      </div>

      {/* ===== ENHANCED MINIMAP ===== */}
      {extendedState && (
        <div className="absolute bottom-24 left-3 z-10">
          <EnhancedMinimap
            agentStates={extendedState.agentStates}
            alliances={extendedState.alliances}
            dangerZones={extendedState.dangerZones}
            timeOfDay={extendedState.timeOfDay}
            selectedAgent={selectedAgent}
          />
        </div>
      )}

      {/* ===== ENHANCED KILL FEED ===== */}
      <div className="absolute top-20 right-3 z-10">
        <EnhancedKillFeed entries={killFeedEntries} />
      </div>

      {/* ===== CAMERA CONTROLS ===== */}
      <div className="absolute bottom-24 right-3 z-10 hidden md:block">
        <div
          className="px-2.5 py-2 space-y-0.5"
          style={{
            background: "rgba(5,5,15,0.8)",
            border: "1px solid rgba(0,240,255,0.08)",
            clipPath: "polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)",
          }}
        >
          {[
            { key: "LMB", action: "ROTATE" },
            { key: "SCROLL", action: "ZOOM" },
            { key: "RMB", action: "PAN" },
            { key: "SPACE", action: "NEXT ROUND" },
            { key: "ESC", action: "CLOSE" },
          ].map((ctrl) => (
            <div key={ctrl.key} className="flex items-center gap-2 text-[7px]">
              <span
                className="font-black tracking-wider px-1 py-0.5 text-cyan-400/60"
                style={{ background: "rgba(0,240,255,0.06)", border: "1px solid rgba(0,240,255,0.1)" }}
              >
                {ctrl.key}
              </span>
              <span className="text-gray-600 font-bold tracking-wider">{ctrl.action}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ===== LOADING OVERLAY ===== */}
      {loading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
          <div className="absolute inset-0 bg-black/30" />
          <div
            className="relative px-10 py-7 text-center animate-bounce-in"
            style={{
              background: "linear-gradient(135deg, rgba(5,5,15,0.95), rgba(15,5,5,0.9))",
              border: "1px solid rgba(255,42,42,0.25)",
              clipPath: "polygon(16px 0, calc(100% - 16px) 0, 100% 16px, 100% calc(100% - 16px), calc(100% - 16px) 100%, 16px 100%, 0 calc(100% - 16px), 0 16px)",
            }}
          >
            <div className="absolute top-0 left-[16px] right-[16px] h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(255,42,42,0.6), transparent)" }} />

            <div className="relative w-14 h-14 mx-auto mb-4">
              <div className="absolute inset-0 border-2 border-red-500/40 animate-spin" style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }} />
              <div className="absolute inset-2 border border-cyan-500/30 animate-spin" style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)", animationDirection: "reverse" }} />
            </div>

            <p className="text-white font-black text-sm tracking-[0.15em] mb-1">{loadingText}...</p>
            <div className="flex items-center justify-center gap-2">
              <div className="w-1 h-1 bg-red-500/60 animate-energy-pulse" style={{ clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }} />
              <p className="text-[8px] font-bold tracking-[0.2em] text-red-400/40 uppercase">Claude AI Processing</p>
              <div className="w-1 h-1 bg-red-500/60 animate-energy-pulse" style={{ clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }} />
            </div>
          </div>
        </div>
      )}

      {/* ===== ROUND SUMMARY OVERLAY ===== */}
      {showRoundSummary && roundSummaryData && !loading && (
        <div className="absolute inset-0 z-30 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="relative max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto custom-scrollbar animate-bounce-in"
            style={{
              background: "linear-gradient(135deg, rgba(5,5,20,0.97), rgba(10,5,15,0.95))",
              border: "1px solid rgba(0,240,255,0.2)",
              clipPath: "polygon(16px 0, calc(100% - 16px) 0, 100% 16px, 100% calc(100% - 16px), calc(100% - 16px) 100%, 16px 100%, 0 calc(100% - 16px), 0 16px)",
            }}
          >
            <div className="absolute top-0 left-[16px] right-[16px] h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(0,240,255,0.6), transparent)" }} />

            <div className="p-6">
              {/* Header */}
              <div className="text-center mb-5">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <div className="h-px w-10 bg-gradient-to-r from-transparent to-cyan-500/40" />
                  <span className="text-2xl">{roundSummaryData.timeOfDay === "night" ? "\uD83C\uDF19" : "\u2600\uFE0F"}</span>
                  <div className="h-px w-10 bg-gradient-to-l from-transparent to-cyan-500/40" />
                </div>
                <h2 className="text-2xl font-black tracking-[0.15em] text-white">ROUND {roundSummaryData.round}</h2>
                <p className="text-[10px] font-bold tracking-[0.2em] uppercase mt-1" style={{ color: roundSummaryData.timeOfDay === "night" ? "rgba(147,130,255,0.6)" : "rgba(255,200,0,0.6)" }}>
                  {roundSummaryData.timeOfDay === "night" ? "NIGHTFALL" : "DAYBREAK"} REPORT
                </p>
              </div>

              {/* Narration */}
              {roundSummaryData.narration && (
                <div className="p-3 mb-4" style={{
                  background: "linear-gradient(135deg, rgba(255,170,0,0.06), rgba(5,5,15,0.8))",
                  borderLeft: "2px solid rgba(255,170,0,0.4)",
                }}>
                  <p className="text-[10px] text-yellow-300/80 italic leading-relaxed font-medium">{roundSummaryData.narration}</p>
                </div>
              )}

              {/* Events */}
              <div className="space-y-2 mb-5">
                {roundSummaryData.events
                  .filter((e) => e.type !== "narration")
                  .map((event, i) => {
                    const typeLabels: Record<string, { label: string; color: string }> = {
                      dialogue: { label: "SPOKE", color: "#60a5fa" },
                      action: { label: "ACTION", color: "#a78bfa" },
                      alliance: { label: "ALLIED", color: "#4ade80" },
                      betrayal: { label: "BETRAYED", color: "#f87171" },
                      conversation: { label: "CHATTED", color: "#818cf8" },
                      elimination: { label: "ELIMINATED", color: "#ef4444" },
                    };
                    const tl = typeLabels[event.type] || { label: "EVENT", color: "#9ca3af" };

                    return (
                      <div key={i} className="flex items-start gap-2 text-[9px] animate-fadeIn" style={{ animationDelay: `${i * 0.05}s` }}>
                        <span className="font-black px-1.5 py-0.5 shrink-0" style={{ color: tl.color, background: `${tl.color}10`, border: `1px solid ${tl.color}20` }}>
                          {tl.label}
                        </span>
                        <div>
                          <span className="font-black" style={{ color: AGENT_HEX[event.agentName] || "#fff" }}>{event.agentName}</span>
                          {event.target && <span className="text-gray-600"> {"\u25B8"} <span style={{ color: AGENT_HEX[event.target] || "#888" }}>{event.target}</span></span>}
                          <p className="text-gray-500 mt-0.5">{event.content}</p>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* AI Vote Preview */}
              {roundSummaryData.voteTally && (
                <div className="mb-5">
                  <p className="text-[9px] font-black text-red-400/60 uppercase tracking-[0.2em] mb-2">AI VOTE INTENTIONS</p>
                  <div className="space-y-1.5">
                    {Object.entries(roundSummaryData.voteTally)
                      .sort(([, a], [, b]) => b.votes - a.votes)
                      .map(([name, data]) => (
                        <div key={name} className="flex items-center gap-2">
                          <span className="text-[9px] font-black w-16 shrink-0" style={{ color: AGENT_HEX[name] || "#fff" }}>
                            {AGENT_EMOJIS[name]} {name}
                          </span>
                          <div className="flex-1 h-2 bg-white/5 relative overflow-hidden" style={{ clipPath: "polygon(0 0, calc(100% - 2px) 0, 100% 100%, 2px 100%)" }}>
                            <div
                              className="h-full transition-all duration-500"
                              style={{
                                width: `${(data.votes / Math.max(1, game.aliveAgentNames.length)) * 100}%`,
                                background: `linear-gradient(90deg, rgba(255,42,42,0.4), rgba(255,42,42,0.8))`,
                              }}
                            />
                          </div>
                          <span className="text-[8px] font-mono text-red-400/60 w-4 text-right">{data.votes}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Continue button */}
              <div className="text-center">
                <button
                  onClick={() => setShowRoundSummary(false)}
                  className="game-btn px-8 py-3 text-white text-sm"
                  style={{ clipPath: "polygon(14px 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 14px 100%, 0 50%)" }}
                >
                  <span className="tracking-[0.2em]">{"\u26A0"} CONTINUE TO VOTE</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== VOTING MODAL ===== */}
      {game.status === "voting" && !hasVoted && !loading && !showRoundSummary && (
        <div className="absolute inset-0 z-30 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative max-w-lg w-full mx-4 animate-bounce-in"
            style={{
              background: "linear-gradient(135deg, rgba(15,5,5,0.97), rgba(20,5,10,0.95))",
              border: "1px solid rgba(255,42,42,0.3)",
              clipPath: "polygon(16px 0, calc(100% - 16px) 0, 100% 16px, 100% calc(100% - 16px), calc(100% - 16px) 100%, 16px 100%, 0 calc(100% - 16px), 0 16px)",
            }}
          >
            {/* Top energy line */}
            <div className="absolute top-0 left-[16px] right-[16px] h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(255,42,42,0.7), transparent)" }} />

            <div className="p-6">
              <div className="text-center mb-5">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <div className="h-px w-10 bg-gradient-to-r from-transparent to-red-500/40" />
                  <div className="text-red-500 text-2xl animate-energy-pulse">{"\u26A0"}</div>
                  <div className="h-px w-10 bg-gradient-to-l from-transparent to-red-500/40" />
                </div>
                <h2 className="text-2xl font-black tracking-[0.15em] text-white">ELIMINATION VOTE</h2>
                <p className="text-[10px] font-bold tracking-[0.2em] text-red-400/50 uppercase mt-1">Select Target For Removal</p>
              </div>
              <VotingPanel
                agents={aliveAgents.map((a) => ({ name: a.name, personality: a.personality }))}
                onVote={handleVote}
                isVoting={true}
                hasVoted={hasVoted}
                votedFor={votedFor}
              />
            </div>
          </div>
        </div>
      )}

      {/* ===== VOTE RESULTS OVERLAY ===== */}
      {showVoteResults && voteResultsData && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 z-25 w-80 animate-bounce-in">
          <div
            className="p-4"
            style={{
              background: "linear-gradient(135deg, rgba(15,5,5,0.97), rgba(5,5,20,0.95))",
              border: "1px solid rgba(255,42,42,0.25)",
              clipPath: "polygon(10px 0, calc(100% - 10px) 0, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0 calc(100% - 10px), 0 10px)",
            }}
          >
            <p className="text-[9px] font-black text-red-400/80 uppercase tracking-[0.2em] mb-2 text-center">VOTE RESULTS</p>
            <div className="space-y-1.5">
              {Object.entries(voteResultsData.tally)
                .sort(([, a], [, b]) => b.votes - a.votes)
                .map(([name, data]) => (
                  <div key={name} className="flex items-center gap-2">
                    <span className="text-[8px] font-black w-14 shrink-0" style={{ color: AGENT_HEX[name] || "#fff" }}>
                      {AGENT_EMOJIS[name]} {name}
                    </span>
                    <div className="flex-1 h-2 bg-white/5 relative overflow-hidden">
                      <div
                        className="h-full transition-all duration-700"
                        style={{
                          width: `${(data.votes / Math.max(1, Object.values(voteResultsData.tally).reduce((s, d) => s + d.votes, 0))) * 100}%`,
                          background: name === voteResultsData.playerVote
                            ? "linear-gradient(90deg, rgba(0,240,255,0.5), rgba(0,240,255,0.9))"
                            : "linear-gradient(90deg, rgba(255,42,42,0.4), rgba(255,42,42,0.7))",
                        }}
                      />
                    </div>
                    <span className="text-[8px] font-mono text-gray-500 w-3 text-right">{data.votes}</span>
                    {data.voters.includes("You") && (
                      <span className="text-[7px] font-black text-cyan-400 bg-cyan-500/10 px-1 rounded">YOU</span>
                    )}
                    {onChainVoted && data.voters.includes("You") && (
                      <span className="text-[6px] font-black text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-1 rounded">ON-CHAIN</span>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== VOTE CONFIRMED BANNER ===== */}
      {hasVoted && votedFor && !showVoteResults && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 animate-slide-up">
          <div
            className="px-6 py-2.5 flex items-center gap-3"
            style={{
              background: "linear-gradient(90deg, rgba(255,42,42,0.15), rgba(5,5,15,0.95), rgba(255,42,42,0.15))",
              border: "1px solid rgba(255,42,42,0.3)",
              clipPath: "polygon(10px 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 10px 100%, 0 50%)",
            }}
          >
            <span className="text-red-500 text-sm">{"\u2620\uFE0F"}</span>
            <span className="text-[10px] font-black tracking-[0.15em] text-red-400">
              {AGENT_EMOJIS[votedFor]} {votedFor.toUpperCase()} ELIMINATED
            </span>
            {onChainVoted && (
              <span className="text-[8px] font-black tracking-wider text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-1.5 py-0.5 rounded">
                ON-CHAIN
              </span>
            )}
            <span className="text-red-500 text-sm">{"\u2620\uFE0F"}</span>
          </div>
        </div>
      )}

      {/* ===== IMMUNITY IDOL BANNER ===== */}
      {immunityBanner && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 animate-bounce-in">
          <div
            className="px-8 py-4 text-center"
            style={{
              background: "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(5,5,15,0.95), rgba(245,158,11,0.15))",
              border: "1px solid rgba(245,158,11,0.4)",
              clipPath: "polygon(16px 0, calc(100% - 16px) 0, 100% 50%, calc(100% - 16px) 100%, 16px 100%, 0 50%)",
            }}
          >
            <div className="text-3xl mb-1">{"\uD83D\uDDFF"}</div>
            <p className="text-sm font-black tracking-[0.2em] text-yellow-400">IMMUNITY IDOL PLAYED!</p>
            <p className="text-[9px] font-bold tracking-wider text-yellow-400/60 mt-1">
              {AGENT_EMOJIS[immunityBanner]} {immunityBanner.toUpperCase()} CANNOT BE ELIMINATED
            </p>
          </div>
        </div>
      )}

      {/* ===== WHISPER TOAST ===== */}
      {whisperToast && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 animate-slide-up">
          <div
            className="px-6 py-2.5 flex items-center gap-3"
            style={{
              background: "linear-gradient(90deg, rgba(180,74,255,0.15), rgba(5,5,15,0.95), rgba(180,74,255,0.15))",
              border: "1px solid rgba(180,74,255,0.3)",
              clipPath: "polygon(10px 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 10px 100%, 0 50%)",
            }}
          >
            <span className="text-purple-400 text-sm">{"\uD83D\uDCAC"}</span>
            <span className="text-[10px] font-black tracking-[0.15em] text-purple-300">{whisperToast}</span>
            <span className="text-purple-400 text-sm">{"\uD83D\uDCAC"}</span>
          </div>
        </div>
      )}

      {/* ===== CONFIRM NEW GAME DIALOG ===== */}
      {showConfirmNewGame && (
        <div className="absolute inset-0 z-40 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative max-w-sm w-full mx-4 animate-bounce-in"
            style={{
              background: "linear-gradient(135deg, rgba(15,5,5,0.97), rgba(20,10,5,0.95))",
              border: "1px solid rgba(255,170,0,0.3)",
              clipPath: "polygon(12px 0, calc(100% - 12px) 0, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0 calc(100% - 12px), 0 12px)",
            }}
          >
            <div className="absolute top-0 left-[12px] right-[12px] h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(255,170,0,0.6), transparent)" }} />

            <div className="p-6 text-center">
              <div className="text-3xl mb-3">{"\u26A0\uFE0F"}</div>
              <h3 className="text-lg font-black text-white tracking-wider mb-2">ABANDON GAME?</h3>
              <p className="text-[10px] text-gray-400 mb-5">Your current game progress will be lost.</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowConfirmNewGame(false)}
                  className="px-5 py-2 text-[10px] font-black tracking-wider text-gray-400 hover:text-white transition-colors"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    clipPath: "polygon(8px 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 8px 100%, 0 50%)",
                  }}
                >
                  CANCEL
                </button>
                <button
                  onClick={startNewGame}
                  className="game-btn px-5 py-2 text-[10px] font-black tracking-wider text-white"
                  style={{ clipPath: "polygon(8px 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 8px 100%, 0 50%)" }}
                >
                  NEW GAME
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== WINNER OVERLAY ===== */}
      {game.status === "ended" && game.winner && (
        <div className="absolute inset-0 z-30 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative animate-bounce-in">
            {/* Outer glow */}
            <div className="absolute -inset-4 -z-10" style={{ background: "radial-gradient(circle, rgba(255,170,0,0.15), transparent 70%)" }} />

            <div
              className="relative max-w-md mx-4 p-8"
              style={{
                background: "linear-gradient(135deg, rgba(5,5,15,0.97), rgba(20,15,5,0.95))",
                border: "1px solid rgba(255,170,0,0.3)",
                clipPath: "polygon(20px 0, calc(100% - 20px) 0, 100% 20px, 100% calc(100% - 20px), calc(100% - 20px) 100%, 20px 100%, 0 calc(100% - 20px), 0 20px)",
              }}
            >
              {/* Top energy line */}
              <div className="absolute top-0 left-[20px] right-[20px] h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(255,170,0,0.8), transparent)" }} />
              {/* Bottom energy line */}
              <div className="absolute bottom-0 left-[20px] right-[20px] h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(255,170,0,0.4), transparent)" }} />

              <div className="text-center">
                {/* Trophy */}
                <div className="text-6xl mb-4 animate-float" style={{ filter: "drop-shadow(0 0 20px rgba(255,170,0,0.5))" }}>{"\uD83C\uDFC6"}</div>

                {/* Winner name */}
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="h-px w-12 bg-gradient-to-r from-transparent to-yellow-500/40" />
                  <span className="text-3xl">{AGENT_EMOJIS[game.winner]}</span>
                  <h2 className="text-3xl font-black text-white tracking-wider">{game.winner}</h2>
                  <div className="h-px w-12 bg-gradient-to-l from-transparent to-yellow-500/40" />
                </div>

                <p className="text-lg font-black gold-text mb-1 tracking-[0.2em]">SURVIVOR CHAMPION</p>
                <p className="text-[10px] text-gray-500 font-bold tracking-[0.15em] mb-5">Last Agent Standing On The Island</p>

                {/* Winner stats */}
                {extendedState && extendedState.agentStates[game.winner] && (() => {
                  const ws = extendedState.agentStates[game.winner];
                  const winnerColor = AGENT_HEX[game.winner] || "#ffaa00";
                  return (
                    <div
                      className="mb-6 p-3"
                      style={{
                        background: `linear-gradient(135deg, ${winnerColor}08, rgba(5,5,15,0.8))`,
                        border: `1px solid ${winnerColor}20`,
                        clipPath: "polygon(8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px), 0 8px)",
                      }}
                    >
                      <div className="grid grid-cols-4 gap-3 text-center">
                        {[
                          { label: "LEVEL", value: ws.level, color: "#ffaa00" },
                          { label: "KILLS", value: ws.kills, color: "#00ff88" },
                          { label: "GOLD", value: ws.gold, color: "#ffaa00" },
                          { label: "ITEMS", value: ws.items.length, color: "#00aaff" },
                        ].map((stat) => (
                          <div key={stat.label}>
                            <div className="text-xl font-black font-mono animate-count-slam" style={{ color: stat.color, textShadow: `0 0 10px ${stat.color}40` }}>
                              {stat.value}
                            </div>
                            <div className="text-[7px] font-black tracking-[0.2em]" style={{ color: `${stat.color}50` }}>{stat.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Play again */}
                <button
                  onClick={startNewGame}
                  className="game-btn px-10 py-4 text-white text-sm"
                  style={{ clipPath: "polygon(14px 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 14px 100%, 0 50%)" }}
                >
                  <span className="tracking-[0.2em]">{"\u25B6"} NEW GAME</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
