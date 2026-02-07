"use client";

import type { Ability } from "@/types/gameTypes";

interface AbilitySlotProps {
  ability: Ability;
  agentColor: string;
}

export default function AbilitySlot({ ability, agentColor }: AbilitySlotProps) {
  const onCooldown = ability.currentCooldown > 0;
  const cooldownPercent = ability.cooldown > 0
    ? (ability.currentCooldown / ability.cooldown) * 100
    : 0;

  return (
    <div className="relative group">
      {/* Main slot - angular shape */}
      <div
        className={`relative w-[52px] h-[52px] flex items-center justify-center text-xl cursor-pointer transition-all duration-200 ${
          onCooldown ? "opacity-60" : "hover:scale-110"
        }`}
        style={{
          background: onCooldown
            ? "linear-gradient(180deg, rgba(30,30,40,0.9), rgba(15,15,20,0.95))"
            : `linear-gradient(180deg, ${agentColor}15, ${agentColor}05)`,
          border: `1px solid ${onCooldown ? "rgba(255,255,255,0.06)" : agentColor + "30"}`,
          clipPath: "polygon(8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px), 0 8px)",
          boxShadow: onCooldown ? "none" : `0 0 12px ${agentColor}15, inset 0 0 12px ${agentColor}08`,
        }}
      >
        <span className={onCooldown ? "grayscale opacity-50" : "drop-shadow-lg"}>
          {ability.icon}
        </span>

        {/* Cooldown sweep overlay */}
        {onCooldown && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `conic-gradient(rgba(0,0,0,0.75) ${cooldownPercent}%, transparent ${cooldownPercent}%)`,
              clipPath: "polygon(8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px), 0 8px)",
            }}
          />
        )}

        {/* Cooldown number */}
        {onCooldown && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <span className="text-white font-black text-lg drop-shadow-[0_0_8px_rgba(0,0,0,1)]">
              {ability.currentCooldown}
            </span>
          </div>
        )}

        {/* Key binding - angular */}
        <div
          className="absolute -top-1 -left-1 w-[18px] h-[18px] flex items-center justify-center text-[8px] font-black z-10"
          style={{
            backgroundColor: onCooldown ? "#333" : agentColor,
            color: onCooldown ? "#888" : "#000",
            clipPath: "polygon(0 0, 100% 0, 100% 70%, 70% 100%, 0 100%)",
            boxShadow: onCooldown ? "none" : `0 0 6px ${agentColor}80`,
          }}
        >
          {ability.key}
        </div>

        {/* Mana cost */}
        <div className="absolute -bottom-0.5 right-0 text-[7px] font-black text-cyan-400/80 bg-black/90 px-1" style={{ clipPath: "polygon(3px 0, 100% 0, calc(100% - 3px) 100%, 0 100%)" }}>
          {ability.manaCost}
        </div>
      </div>

      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-52 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        <div className="hud-panel rounded-none p-3 corner-brackets" style={{ clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))" }}>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-lg">{ability.icon}</span>
            <div>
              <span className="text-xs font-black text-white uppercase tracking-wider">{ability.name}</span>
              {ability.isPassive && (
                <span className="text-[7px] bg-yellow-500/20 text-yellow-400 px-1 ml-1 uppercase font-bold">PASSIVE</span>
              )}
            </div>
          </div>
          <p className="text-[10px] text-gray-400 leading-relaxed mb-2">{ability.description}</p>
          <div className="flex items-center gap-4 text-[9px] border-t border-white/5 pt-1.5">
            <span className="text-cyan-400 font-bold">MANA {ability.manaCost}</span>
            <span className="text-gray-500 font-bold">CD {ability.cooldown}R</span>
          </div>
        </div>
      </div>
    </div>
  );
}
