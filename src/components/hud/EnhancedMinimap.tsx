"use client";

import { useState, useEffect } from "react";
import type { AgentGameState } from "@/types/gameTypes";
import { AGENT_POSITIONS, ISLAND_RADIUS_VAL } from "@/lib/gamePositions";

const AGENT_HEX: Record<string, string> = {
  Shadow: "#8b5cf6", Blaze: "#ef4444", Luna: "#ec4899",
  Tank: "#3b82f6", Viper: "#22c55e", Nova: "#eab308",
};

interface EnhancedMinimapProps {
  agentStates: Record<string, AgentGameState>;
  alliances: [string, string][];
  dangerZones: { x: number; z: number; radius: number }[];
  timeOfDay: "day" | "night";
  selectedAgent: string | null;
}

export default function EnhancedMinimap({
  agentStates,
  alliances,
  dangerZones,
  timeOfDay,
  selectedAgent,
}: EnhancedMinimapProps) {
  const [positions, setPositions] = useState<Record<string, { x: number; z: number }>>({});
  const [scanAngle, setScanAngle] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPositions({ ...AGENT_POSITIONS });
      setScanAngle((prev) => (prev + 2) % 360);
    }, 60);
    return () => clearInterval(interval);
  }, []);

  const mapSize = 190;
  const toMapCoord = (val: number) => (val / (ISLAND_RADIUS_VAL * 2)) * 70 + 50;
  const isNight = timeOfDay === "night";
  const accentColor = isNight ? "59,130,246" : "0,240,255";

  return (
    <div className="relative" style={{ width: mapSize, height: mapSize }}>
      {/* Outer frame - angular */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{
          background: `linear-gradient(135deg, rgba(5,5,15,0.95), rgba(8,8,25,0.9))`,
          border: `1px solid rgba(${accentColor},0.2)`,
          clipPath: "polygon(12px 0, calc(100% - 12px) 0, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0 calc(100% - 12px), 0 12px)",
        }}
      >
        {/* Top energy line */}
        <div
          className="absolute top-0 left-[12px] right-[12px] h-px"
          style={{ background: `linear-gradient(90deg, transparent, rgba(${accentColor},0.6), transparent)` }}
        />
        {/* Bottom energy line */}
        <div
          className="absolute bottom-0 left-[12px] right-[12px] h-px"
          style={{ background: `linear-gradient(90deg, transparent, rgba(${accentColor},0.3), transparent)` }}
        />

        {/* Terrain - hexagonal island outline */}
        <div
          className="absolute"
          style={{
            width: "72%",
            height: "72%",
            left: "14%",
            top: "14%",
            clipPath: "polygon(50% 3%, 93% 25%, 93% 75%, 50% 97%, 7% 75%, 7% 25%)",
            border: `1px solid rgba(${accentColor},0.12)`,
            background: isNight
              ? "linear-gradient(180deg, rgba(20,20,50,0.4), rgba(10,10,30,0.6))"
              : "linear-gradient(180deg, rgba(10,40,20,0.3), rgba(5,20,10,0.4))",
          }}
        />

        {/* Grid - crosshair */}
        <div className="absolute top-1/2 left-[10%] right-[10%] h-px" style={{ background: `rgba(${accentColor},0.06)` }} />
        <div className="absolute left-1/2 top-[10%] bottom-[10%] w-px" style={{ background: `rgba(${accentColor},0.06)` }} />
        {/* Diagonal grid */}
        <div
          className="absolute top-0 left-0 w-full h-full"
          style={{
            background: `
              repeating-linear-gradient(0deg, transparent, transparent 19px, rgba(${accentColor},0.03) 19px, rgba(${accentColor},0.03) 20px),
              repeating-linear-gradient(90deg, transparent, transparent 19px, rgba(${accentColor},0.03) 19px, rgba(${accentColor},0.03) 20px)
            `,
          }}
        />

        {/* Radar sweep */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            width: "72%",
            height: "72%",
            background: `conic-gradient(from ${scanAngle}deg, transparent 0deg, rgba(${accentColor},0.12) 30deg, transparent 60deg)`,
            clipPath: "polygon(50% 3%, 93% 25%, 93% 75%, 50% 97%, 7% 75%, 7% 25%)",
          }}
        />

        {/* Concentric range rings */}
        {[30, 50].map((size) => (
          <div
            key={size}
            className="absolute rounded-full"
            style={{
              width: `${size}%`,
              height: `${size}%`,
              left: `${(100 - size) / 2}%`,
              top: `${(100 - size) / 2}%`,
              border: `1px solid rgba(${accentColor},0.05)`,
            }}
          />
        ))}

        {/* Danger Zones */}
        {dangerZones.map((zone, i) => {
          const cx = toMapCoord(zone.x);
          const cy = toMapCoord(zone.z);
          const size = (zone.radius / ISLAND_RADIUS_VAL) * 35;
          return (
            <div
              key={`dz-${i}`}
              className="absolute animate-danger-pulse"
              style={{
                left: `${cx}%`,
                top: `${cy}%`,
                width: `${size}%`,
                height: `${size}%`,
                transform: "translate(-50%, -50%)",
                background: "radial-gradient(circle, rgba(255,42,42,0.25), transparent 70%)",
                border: "1px solid rgba(255,42,42,0.3)",
                clipPath: "polygon(50% 5%, 95% 25%, 95% 75%, 50% 95%, 5% 75%, 5% 25%)",
              }}
            />
          );
        })}

        {/* Alliance lines */}
        <svg className="absolute inset-0 w-full h-full" style={{ overflow: "visible" }}>
          {alliances.map(([a, b], i) => {
            const posA = positions[a];
            const posB = positions[b];
            if (!posA || !posB) return null;
            const x1 = (toMapCoord(posA.x) / 100) * mapSize;
            const y1 = (toMapCoord(posA.z) / 100) * mapSize;
            const x2 = (toMapCoord(posB.x) / 100) * mapSize;
            const y2 = (toMapCoord(posB.z) / 100) * mapSize;
            return (
              <line
                key={`al-${i}`}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="rgba(0,255,136,0.35)"
                strokeWidth="1"
                strokeDasharray="4,4"
              />
            );
          })}
        </svg>

        {/* Center marker - campfire */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div
            className="w-2.5 h-2.5 animate-energy-pulse"
            style={{
              background: "linear-gradient(135deg, #ff6600, #ff2a00)",
              clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
              boxShadow: "0 0 8px rgba(255,100,0,0.6)",
            }}
          />
        </div>

        {/* Agent markers */}
        {Object.values(agentStates).map((agent) => {
          const pos = positions[agent.name];
          if (!pos) return null;
          const mapX = toMapCoord(pos.x);
          const mapY = toMapCoord(pos.z);
          const color = AGENT_HEX[agent.name] || "#888";
          const isStealthed = agent.statusEffects.some((se) => se.id === "stealth");
          const isSelected = selectedAgent === agent.name;

          return (
            <div
              key={agent.name}
              className="absolute transition-all duration-100"
              style={{
                left: `${mapX}%`,
                top: `${mapY}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              {/* Selection indicator */}
              {isSelected && agent.isAlive && (
                <div
                  className="absolute -inset-2 animate-crosshair"
                  style={{
                    border: `1px solid ${color}`,
                    clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
                  }}
                />
              )}

              {/* Agent dot */}
              <div
                className="transition-all"
                style={{
                  width: !agent.isAlive ? 4 : isStealthed ? 6 : 10,
                  height: !agent.isAlive ? 4 : isStealthed ? 6 : 10,
                  opacity: !agent.isAlive ? 0.15 : isStealthed ? 0.3 : 1,
                  backgroundColor: agent.isAlive ? color : "#444",
                  clipPath: agent.isAlive ? "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" : "none",
                  borderRadius: agent.isAlive ? 0 : "50%",
                  boxShadow: agent.isAlive && !isStealthed
                    ? `0 0 6px ${color}, 0 0 12px ${color}40`
                    : "none",
                }}
              />

              {/* Name tag */}
              {agent.isAlive && !isStealthed && (
                <div
                  className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 text-[5px] font-black uppercase tracking-[0.15em] whitespace-nowrap"
                  style={{
                    color,
                    textShadow: `0 0 4px ${color}60`,
                  }}
                >
                  {agent.name}
                </div>
              )}
            </div>
          );
        })}

        {/* Night fog of war */}
        {isNight && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "radial-gradient(circle at 50% 50%, transparent 25%, rgba(0,0,20,0.55) 100%)",
            }}
          />
        )}

        {/* Corner accent markers */}
        {[
          { top: 4, left: 4 },
          { top: 4, right: 4 },
          { bottom: 4, left: 4 },
          { bottom: 4, right: 4 },
        ].map((pos, i) => (
          <div
            key={i}
            className="absolute w-2 h-2"
            style={{
              ...pos,
              borderTop: i < 2 ? `1px solid rgba(${accentColor},0.4)` : undefined,
              borderBottom: i >= 2 ? `1px solid rgba(${accentColor},0.4)` : undefined,
              borderLeft: i % 2 === 0 ? `1px solid rgba(${accentColor},0.4)` : undefined,
              borderRight: i % 2 === 1 ? `1px solid rgba(${accentColor},0.4)` : undefined,
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* Bottom label */}
      <div
        className="absolute -bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-0.5"
        style={{
          background: `rgba(5,5,15,0.9)`,
          border: `1px solid rgba(${accentColor},0.15)`,
          clipPath: "polygon(6px 0, calc(100% - 6px) 0, 100% 100%, 0 100%)",
        }}
      >
        <div
          className="w-1 h-1 animate-energy-pulse"
          style={{
            backgroundColor: isNight ? "#3b82f6" : "#00f0ff",
            clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
          }}
        />
        <span
          className="text-[6px] font-black tracking-[0.25em] uppercase"
          style={{ color: isNight ? "#3b82f6" : "#00f0ff" }}
        >
          {isNight ? "NIGHT RECON" : "TACTICAL MAP"}
        </span>
      </div>
    </div>
  );
}
