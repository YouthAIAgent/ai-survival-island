"use client";

import { useEffect, useState } from "react";
import type { KillFeedEntry } from "@/types/gameTypes";

const AGENT_EMOJIS: Record<string, string> = {
  Shadow: "\uD83E\uDD77", Blaze: "\uD83D\uDD25", Luna: "\uD83C\uDF19",
  Tank: "\uD83D\uDEE1\uFE0F", Viper: "\uD83D\uDC0D", Nova: "\u2728",
  Island: "\uD83C\uDFDD\uFE0F",
};

const AGENT_HEX: Record<string, string> = {
  Shadow: "#8b5cf6", Blaze: "#ef4444", Luna: "#ec4899",
  Tank: "#3b82f6", Viper: "#22c55e", Nova: "#eab308",
  Island: "#888888",
};

interface EnhancedKillFeedProps {
  entries: KillFeedEntry[];
  maxVisible?: number;
}

export default function EnhancedKillFeed({ entries, maxVisible = 4 }: EnhancedKillFeedProps) {
  const [visibleEntries, setVisibleEntries] = useState<KillFeedEntry[]>([]);

  useEffect(() => {
    setVisibleEntries(entries.slice(-maxVisible));
  }, [entries, maxVisible]);

  if (visibleEntries.length === 0) return null;

  return (
    <div className="space-y-1">
      {visibleEntries.map((entry, i) => {
        const killerColor = AGENT_HEX[entry.killerName] || "#888";
        const victimColor = AGENT_HEX[entry.victimName] || "#888";

        return (
          <div
            key={entry.id}
            className="flex items-center gap-1 animate-slide-in-right"
            style={{ animationDelay: `${i * 0.08}s` }}
          >
            <div
              className="flex items-center gap-1 px-2 py-1"
              style={{
                background: `linear-gradient(90deg, ${killerColor}20, rgba(255,42,42,0.1), rgba(5,5,15,0.9))`,
                borderLeft: `2px solid ${killerColor}`,
                clipPath: "polygon(0 0, calc(100% - 6px) 0, 100% 100%, 0 100%)",
              }}
            >
              {/* Killer */}
              <div
                className="w-5 h-5 flex items-center justify-center text-[10px]"
                style={{ background: `${killerColor}20`, border: `1px solid ${killerColor}40` }}
              >
                {AGENT_EMOJIS[entry.killerName] || "\u2620\uFE0F"}
              </div>
              <span className="text-[9px] font-black" style={{ color: killerColor }}>{entry.killerName}</span>

              {/* Kill icon */}
              <div className="w-4 h-4 flex items-center justify-center text-[10px] bg-red-500/15 border border-red-500/25">
                {entry.abilityIcon}
              </div>

              {/* Victim */}
              <div
                className="w-5 h-5 flex items-center justify-center text-[10px] grayscale opacity-50"
                style={{ background: `${victimColor}15`, border: `1px solid ${victimColor}30` }}
              >
                {AGENT_EMOJIS[entry.victimName] || "\u2620\uFE0F"}
              </div>
              <span className="text-[9px] font-bold text-gray-500 line-through">{entry.victimName}</span>

              {/* Gold */}
              {entry.goldEarned > 0 && (
                <span className="text-[8px] font-black ml-1" style={{ color: "#ffaa00" }}>+{entry.goldEarned}g</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
