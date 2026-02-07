"use client";

import type { Item } from "@/types/gameTypes";
import { RARITY_COLORS, RARITY_GLOW } from "@/types/gameTypes";

interface ItemSlotProps {
  item: Item | null;
  index: number;
}

export default function ItemSlot({ item, index }: ItemSlotProps) {
  if (!item) {
    return (
      <div
        className="w-[38px] h-[38px] flex items-center justify-center"
        style={{
          background: "rgba(255,255,255,0.015)",
          border: "1px solid rgba(255,255,255,0.04)",
          clipPath: "polygon(4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 4px), 0 4px)",
        }}
      >
        <span className="text-[8px] text-gray-800 font-mono">{index + 1}</span>
      </div>
    );
  }

  const rarityColor = RARITY_COLORS[item.rarity];
  const glow = RARITY_GLOW[item.rarity];

  return (
    <div className="relative group">
      <div
        className="w-[38px] h-[38px] flex items-center justify-center text-base cursor-pointer hover:scale-110 transition-all duration-200"
        style={{
          background: `linear-gradient(180deg, ${rarityColor}15, ${rarityColor}05)`,
          border: `1px solid ${rarityColor}50`,
          clipPath: "polygon(4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 4px), 0 4px)",
          boxShadow: glow,
        }}
      >
        {item.icon}
      </div>

      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-44 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        <div className="hud-panel rounded-none p-2.5" style={{ clipPath: "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))" }}>
          <div className="flex items-center gap-1.5 mb-1">
            <span>{item.icon}</span>
            <span className="text-xs font-black uppercase tracking-wider" style={{ color: rarityColor }}>
              {item.name}
            </span>
          </div>
          <span
            className="text-[7px] uppercase font-black px-1.5 inline-block mb-1"
            style={{ color: rarityColor, background: `${rarityColor}15`, border: `1px solid ${rarityColor}30` }}
          >
            {item.rarity}
          </span>
          <p className="text-[10px] text-gray-400 leading-relaxed">{item.description}</p>
        </div>
      </div>
    </div>
  );
}
