"use client";

import type { AgentGameState, TimeOfDay } from "@/types/gameTypes";

const AGENT_EMOJIS: Record<string, string> = {
  Shadow: "\uD83E\uDD77", Blaze: "\uD83D\uDD25", Luna: "\uD83C\uDF19",
  Tank: "\uD83D\uDEE1\uFE0F", Viper: "\uD83D\uDC0D", Nova: "\u2728",
};

const AGENT_HEX: Record<string, string> = {
  Shadow: "#8b5cf6", Blaze: "#ef4444", Luna: "#ec4899",
  Tank: "#3b82f6", Viper: "#22c55e", Nova: "#eab308",
};

interface TopHeroBarProps {
  agentStates: Record<string, AgentGameState>;
  selectedAgent: string | null;
  onSelectAgent: (name: string) => void;
  round: number;
  aliveCount: number;
  timeOfDay: TimeOfDay;
  gameStatus: string;
}

export default function TopHeroBar({
  agentStates,
  selectedAgent,
  onSelectAgent,
  round,
  aliveCount,
  timeOfDay,
  gameStatus,
}: TopHeroBarProps) {
  const agents = Object.values(agentStates);

  return (
    <div className="hud-panel rounded-none flex items-center">
      {/* Left wing - Game stats */}
      <div className="flex items-center gap-3 px-4 py-2 clip-slant-right" style={{ background: "linear-gradient(90deg, rgba(0,240,255,0.06), transparent)" }}>
        <div className="text-center">
          <div className="text-2xl font-black text-white font-mono tracking-tighter leading-none">{round}</div>
          <div className="text-[7px] text-cyan-500/60 uppercase tracking-[0.2em] font-bold">ROUND</div>
        </div>
        <div className="w-px h-8 bg-cyan-500/10" />
        <div className="text-center">
          <div className="text-2xl font-black font-mono tracking-tighter leading-none" style={{ color: "#00ff88" }}>{aliveCount}</div>
          <div className="text-[7px] text-green-500/60 uppercase tracking-[0.2em] font-bold">ALIVE</div>
        </div>
        <div className="w-px h-8 bg-cyan-500/10" />
        <div className="flex flex-col items-center">
          <span className="text-lg leading-none">{timeOfDay === "day" ? "\u2600\uFE0F" : "\uD83C\uDF19"}</span>
          <span className="text-[7px] uppercase tracking-[0.15em] font-bold mt-0.5" style={{ color: timeOfDay === "night" ? "#4488ff" : "#ffaa44" }}>{timeOfDay}</span>
        </div>
      </div>

      {/* Center - Agent Portraits */}
      <div className="flex items-center gap-0 flex-1 justify-center py-1.5">
        {agents.map((agent, i) => {
          const isSelected = selectedAgent === agent.name;
          const hpPct = agent.maxHp > 0 ? (agent.hp / agent.maxHp) * 100 : 0;
          const manaPct = agent.maxMana > 0 ? (agent.mana / agent.maxMana) * 100 : 0;
          const color = AGENT_HEX[agent.name] || "#888";

          return (
            <button
              key={agent.name}
              onClick={() => onSelectAgent(agent.name)}
              className="relative flex flex-col items-center transition-all duration-200 group"
              style={{ marginLeft: i === 0 ? 0 : -2, zIndex: isSelected ? 10 : 1 }}
            >
              {/* Selection indicator */}
              {isSelected && agent.isAlive && (
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-r-[5px] border-t-[5px] border-l-transparent border-r-transparent" style={{ borderTopColor: color }} />
              )}

              {/* Portrait container */}
              <div
                className={`relative w-[52px] h-[56px] flex flex-col items-center justify-center transition-all ${
                  !agent.isAlive ? "opacity-25 grayscale" : isSelected ? "scale-110" : "hover:scale-105 cursor-pointer"
                }`}
                style={{
                  background: isSelected
                    ? `linear-gradient(180deg, ${color}25, ${color}08)`
                    : "linear-gradient(180deg, rgba(255,255,255,0.03), transparent)",
                  borderLeft: `1px solid ${isSelected ? color + "40" : "rgba(255,255,255,0.04)"}`,
                  borderRight: `1px solid ${isSelected ? color + "40" : "rgba(255,255,255,0.04)"}`,
                  clipPath: "polygon(15% 0%, 85% 0%, 100% 15%, 100% 100%, 0% 100%, 0% 15%)",
                }}
              >
                {/* Avatar */}
                <div className="text-xl mb-0.5">{AGENT_EMOJIS[agent.name]}</div>

                {/* Name */}
                <span className="text-[8px] font-black text-white/80 tracking-wider uppercase">{agent.name}</span>

                {/* Level badge */}
                <div
                  className="absolute top-0.5 right-0.5 w-3.5 h-3.5 flex items-center justify-center text-[7px] font-black text-black"
                  style={{ backgroundColor: color, clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }}
                >
                  {agent.level}
                </div>

                {/* Dead overlay */}
                {!agent.isAlive && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <span className="text-red-500 text-xl font-black">\u2715</span>
                  </div>
                )}
              </div>

              {/* HP bar */}
              <div className="w-[48px] h-[3px] bg-black/80 mt-px" style={{ clipPath: "polygon(2px 0, 100% 0, calc(100% - 2px) 100%, 0 100%)" }}>
                <div
                  className="h-full transition-all duration-500"
                  style={{
                    width: `${hpPct}%`,
                    background: hpPct > 60 ? "linear-gradient(90deg, #00ff88, #22c55e)" : hpPct > 30 ? "linear-gradient(90deg, #ffaa00, #eab308)" : "linear-gradient(90deg, #ff2a2a, #ef4444)",
                  }}
                />
              </div>
              {/* Mana bar */}
              <div className="w-[48px] h-[2px] bg-black/80" style={{ clipPath: "polygon(2px 0, 100% 0, calc(100% - 2px) 100%, 0 100%)" }}>
                <div
                  className="h-full transition-all duration-500"
                  style={{ width: `${manaPct}%`, background: "linear-gradient(90deg, #0066ff, #00aaff)" }}
                />
              </div>

              {/* KDA */}
              <div className="text-[6px] text-gray-600 font-mono mt-0.5 tracking-wider">
                <span className="text-green-500/70">{agent.kills}</span>
                <span>/</span>
                <span className="text-red-500/70">{agent.deaths}</span>
                <span>/</span>
                <span className="text-blue-500/70">{agent.assists}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Right wing - Status */}
      <div className="flex items-center gap-3 px-4 py-2 clip-slant-left" style={{ background: "linear-gradient(270deg, rgba(255,42,42,0.06), transparent)" }}>
        <div
          className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] ${
            gameStatus === "active"
              ? "text-green-400"
              : gameStatus === "voting"
              ? "text-red-400 animate-danger-pulse"
              : gameStatus === "ended"
              ? "text-yellow-400"
              : "text-gray-400"
          }`}
          style={{
            background: gameStatus === "voting" ? "rgba(255,42,42,0.1)" : "rgba(255,255,255,0.03)",
            clipPath: "polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)",
            border: `1px solid ${gameStatus === "voting" ? "rgba(255,42,42,0.3)" : "rgba(255,255,255,0.06)"}`,
          }}
        >
          {gameStatus === "voting" ? "\u26A0 VOTE" : gameStatus.toUpperCase()}
        </div>
      </div>
    </div>
  );
}
