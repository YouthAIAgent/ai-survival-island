// ============= DOTA 2-STYLE GAME TYPES =============

export type TimeOfDay = "day" | "night";

export type ItemRarity = "common" | "uncommon" | "rare" | "legendary";

export interface Ability {
  id: string;
  name: string;
  key: "Q" | "W" | "E" | "R";
  icon: string;        // emoji
  description: string;
  cooldown: number;     // rounds
  currentCooldown: number;
  manaCost: number;
  isPassive: boolean;
}

export interface Item {
  id: string;
  name: string;
  icon: string;         // emoji
  description: string;
  rarity: ItemRarity;
  effect: string;
}

export interface StatusEffect {
  id: string;
  name: string;
  icon: string;
  type: "buff" | "debuff";
  duration: number;     // rounds remaining
  description: string;
}

export interface AgentGameState {
  name: string;
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  level: number;
  xp: number;
  xpToNext: number;
  gold: number;
  kills: number;
  deaths: number;
  assists: number;
  abilities: Ability[];
  items: Item[];
  statusEffects: StatusEffect[];
  isAlive: boolean;
}

export interface ExtendedGameState {
  agentStates: Record<string, AgentGameState>;
  timeOfDay: TimeOfDay;
  roundNumber: number;
  alliances: [string, string][];   // pairs of allied agent names
  dangerZones: { x: number; z: number; radius: number }[];
}

export interface KillFeedEntry {
  id: string;
  timestamp: number;
  killerName: string;
  victimName: string;
  abilityIcon: string;
  abilityName: string;
  goldEarned: number;
}

// Rarity color map
export const RARITY_COLORS: Record<ItemRarity, string> = {
  common: "#9ca3af",       // gray
  uncommon: "#22c55e",     // green
  rare: "#3b82f6",         // blue
  legendary: "#f59e0b",    // gold
};

export const RARITY_GLOW: Record<ItemRarity, string> = {
  common: "none",
  uncommon: "0 0 8px rgba(34,197,94,0.5)",
  rare: "0 0 10px rgba(59,130,246,0.6)",
  legendary: "0 0 12px rgba(245,158,11,0.7), 0 0 20px rgba(245,158,11,0.3)",
};
