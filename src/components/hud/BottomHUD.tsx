"use client";

import type { AgentGameState } from "@/types/gameTypes";
import AbilitySlot from "./AbilitySlot";
import ItemSlot from "./ItemSlot";

const AGENT_EMOJIS: Record<string, string> = {
  Shadow: "\uD83E\uDD77", Blaze: "\uD83D\uDD25", Luna: "\uD83C\uDF19",
  Tank: "\uD83D\uDEE1\uFE0F", Viper: "\uD83D\uDC0D", Nova: "\u2728",
};

const AGENT_HEX: Record<string, string> = {
  Shadow: "#8b5cf6", Blaze: "#ef4444", Luna: "#ec4899",
  Tank: "#3b82f6", Viper: "#22c55e", Nova: "#eab308",
};

interface BottomHUDProps {
  agent: AgentGameState | null;
  onSimulateRound: () => void;
  onStartNewGame: () => void;
  loading: boolean;
  loadingText: string;
  gameStatus: string;
  nextRound: number;
}

export default function BottomHUD({
  agent,
  onSimulateRound,
  onStartNewGame,
  loading,
  loadingText,
  gameStatus,
  nextRound,
}: BottomHUDProps) {
  if (!agent) {
    return (
      <div className="hud-panel rounded-none px-6 py-4 text-center">
        <p className="text-xs text-cyan-500/40 font-mono uppercase tracking-[0.2em]">// SELECT AGENT FROM HUD //</p>
      </div>
    );
  }

  const color = AGENT_HEX[agent.name] || "#888";
  const hpPct = agent.maxHp > 0 ? (agent.hp / agent.maxHp) * 100 : 0;
  const manaPct = agent.maxMana > 0 ? (agent.mana / agent.maxMana) * 100 : 0;
  const xpPct = agent.xpToNext > 0 ? (agent.xp / agent.xpToNext) * 100 : 0;

  const itemSlots = [...agent.items];
  while (itemSlots.length < 6) itemSlots.push(null as any);

  return (
    <div className="hud-panel rounded-none flex items-center px-1.5 py-1.5 gap-0">

      {/* ===== LEFT: Portrait + Bars ===== */}
      <div className="flex items-center gap-2 px-2 py-1" style={{ borderRight: "1px solid rgba(0,240,255,0.08)" }}>
        {/* Portrait */}
        <div className="relative">
          <div
            className="w-[60px] h-[60px] flex items-center justify-center text-3xl portrait-frame"
            style={{
              background: `linear-gradient(135deg, ${color}30, ${color}08)`,
              border: `2px solid ${color}50`,
              boxShadow: `0 0 15px ${color}20, inset 0 0 15px ${color}10`,
            }}
          >
            {AGENT_EMOJIS[agent.name]}
            {!agent.isAlive && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center portrait-frame">
                <span className="text-red-500 text-2xl">\u2620\uFE0F</span>
              </div>
            )}
          </div>
          {/* Level */}
          <div
            className="absolute -bottom-1 -right-1 w-6 h-6 flex items-center justify-center text-[10px] font-black text-black"
            style={{ backgroundColor: color, clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)", boxShadow: `0 0 8px ${color}80` }}
          >
            {agent.level}
          </div>
        </div>

        {/* Bars */}
        <div className="w-[120px] space-y-1">
          {/* HP */}
          <div>
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[7px] font-black tracking-wider" style={{ color: hpPct > 60 ? "#00ff88" : hpPct > 30 ? "#ffaa00" : "#ff2a2a" }}>HP</span>
              <span className="text-[8px] text-gray-500 font-mono">{agent.hp}/{agent.maxHp}</span>
            </div>
            <div className="h-[5px] bg-black/60 relative" style={{ clipPath: "polygon(0 0, calc(100% - 3px) 0, 100% 100%, 3px 100%)" }}>
              <div
                className="h-full transition-all duration-700 relative"
                style={{
                  width: `${hpPct}%`,
                  background: hpPct > 60 ? "linear-gradient(90deg, #00cc66, #00ff88)" : hpPct > 30 ? "linear-gradient(90deg, #cc8800, #ffaa00)" : "linear-gradient(90deg, #cc0000, #ff2a2a)",
                  boxShadow: `0 0 8px ${hpPct > 60 ? "#00ff8840" : hpPct > 30 ? "#ffaa0040" : "#ff2a2a40"}`,
                }}
              >
                <div className="absolute inset-0" style={{ background: "repeating-linear-gradient(90deg, transparent, transparent 4px, rgba(0,0,0,0.2) 4px, rgba(0,0,0,0.2) 5px)" }} />
              </div>
            </div>
          </div>

          {/* Mana */}
          <div>
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[7px] font-black text-cyan-400 tracking-wider">MANA</span>
              <span className="text-[8px] text-gray-500 font-mono">{agent.mana}/{agent.maxMana}</span>
            </div>
            <div className="h-[4px] bg-black/60" style={{ clipPath: "polygon(0 0, calc(100% - 3px) 0, 100% 100%, 3px 100%)" }}>
              <div
                className="h-full transition-all duration-700"
                style={{
                  width: `${manaPct}%`,
                  background: "linear-gradient(90deg, #0055cc, #00aaff)",
                  boxShadow: "0 0 6px rgba(0,170,255,0.3)",
                }}
              />
            </div>
          </div>

          {/* XP */}
          <div>
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[7px] font-black text-purple-400 tracking-wider">EXP</span>
              <span className="text-[8px] text-gray-500 font-mono">{agent.xp}/{agent.xpToNext}</span>
            </div>
            <div className="h-[3px] bg-black/60" style={{ clipPath: "polygon(0 0, calc(100% - 3px) 0, 100% 100%, 3px 100%)" }}>
              <div className="h-full xp-bar-fill transition-all duration-700" style={{ width: `${xpPct}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* ===== CENTER-LEFT: Abilities ===== */}
      <div className="flex items-center gap-1 px-3 py-1" style={{ borderRight: "1px solid rgba(0,240,255,0.08)" }}>
        {agent.abilities.map((ability) => (
          <AbilitySlot key={ability.id} ability={ability} agentColor={color} />
        ))}
      </div>

      {/* ===== CENTER: Inventory ===== */}
      <div className="flex flex-col gap-0.5 px-3 py-1" style={{ borderRight: "1px solid rgba(0,240,255,0.08)" }}>
        <div className="flex items-center gap-0.5">
          {itemSlots.slice(0, 3).map((item, i) => (
            <ItemSlot key={i} item={item} index={i} />
          ))}
        </div>
        <div className="flex items-center gap-0.5">
          {itemSlots.slice(3, 6).map((item, i) => (
            <ItemSlot key={i + 3} item={item} index={i + 3} />
          ))}
        </div>
      </div>

      {/* ===== CENTER-RIGHT: Gold + KDA + Buffs ===== */}
      <div className="flex flex-col items-center gap-1 px-3 py-1" style={{ borderRight: "1px solid rgba(0,240,255,0.08)" }}>
        {/* Gold */}
        <div className="flex items-center gap-1.5">
          <span className="text-base">\uD83D\uDCB0</span>
          <span className="text-lg font-black font-mono" style={{ color: "#ffaa00", textShadow: "0 0 10px rgba(255,170,0,0.4)" }}>{agent.gold}</span>
        </div>
        {/* KDA */}
        <div className="text-[10px] font-mono font-bold">
          <span className="text-green-400">{agent.kills}</span>
          <span className="text-gray-700"> / </span>
          <span className="text-red-400">{agent.deaths}</span>
          <span className="text-gray-700"> / </span>
          <span className="text-cyan-400">{agent.assists}</span>
        </div>
        {/* Status Effects */}
        {agent.statusEffects.length > 0 && (
          <div className="flex gap-0.5 flex-wrap justify-center max-w-[70px]">
            {agent.statusEffects.map((se, i) => (
              <div
                key={i}
                className="text-[10px] px-1 animate-buff-float"
                style={{
                  background: se.type === "buff" ? "rgba(0,255,136,0.1)" : "rgba(255,42,42,0.1)",
                  border: `1px solid ${se.type === "buff" ? "rgba(0,255,136,0.2)" : "rgba(255,42,42,0.2)"}`,
                }}
                title={`${se.name}: ${se.description} (${se.duration}R)`}
              >
                {se.icon}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===== RIGHT: Action Button ===== */}
      <div className="flex-shrink-0 px-3">
        {gameStatus !== "ended" ? (
          <button
            onClick={gameStatus === "voting" ? undefined : onSimulateRound}
            disabled={loading || gameStatus === "voting"}
            className="game-btn px-6 py-3 text-white text-sm disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ clipPath: "polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%)" }}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {loadingText}
              </span>
            ) : gameStatus === "voting" ? (
              "\u26A0 VOTE FIRST"
            ) : (
              `\u25B6 ROUND ${nextRound}`
            )}
          </button>
        ) : (
          <button
            onClick={onStartNewGame}
            className="game-btn px-6 py-3 text-white text-sm"
            style={{ clipPath: "polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%)" }}
          >
            NEW GAME
          </button>
        )}
      </div>
    </div>
  );
}
