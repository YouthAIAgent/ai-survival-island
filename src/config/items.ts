import type { Item } from "@/types/gameTypes";

export const GAME_ITEMS: Item[] = [
  {
    id: "survival_knife",
    name: "Survival Knife",
    icon: "\uD83D\uDD2A",
    description: "+15 attack damage. A trusty blade for the island.",
    rarity: "common",
    effect: "damage_boost",
  },
  {
    id: "coconut",
    name: "Coconut",
    icon: "\uD83E\uDD65",
    description: "Restores 20 HP when consumed. Refreshing!",
    rarity: "common",
    effect: "heal",
  },
  {
    id: "shield_fragment",
    name: "Shield Fragment",
    icon: "\uD83D\uDEE1\uFE0F",
    description: "+10 armor. A broken piece of ancient protection.",
    rarity: "uncommon",
    effect: "armor_boost",
  },
  {
    id: "poison_vial",
    name: "Poison Vial",
    icon: "\uD83E\uDDEA",
    description: "Apply poison to your next attack. Deals 10 damage over 2 rounds.",
    rarity: "uncommon",
    effect: "poison",
  },
  {
    id: "alliance_ring",
    name: "Alliance Ring",
    icon: "\uD83D\uDC8D",
    description: "Strengthens alliance bonds. +20% loyalty when allied.",
    rarity: "rare",
    effect: "alliance_boost",
  },
  {
    id: "immunity_idol",
    name: "Immunity Idol",
    icon: "\uD83D\uDDFF",
    description: "Survive one elimination vote. Legendary protection.",
    rarity: "legendary",
    effect: "immunity",
  },
];

// Drop chance weights by rarity
export const RARITY_DROP_WEIGHTS: Record<string, number> = {
  common: 40,
  uncommon: 30,
  rare: 20,
  legendary: 10,
};
