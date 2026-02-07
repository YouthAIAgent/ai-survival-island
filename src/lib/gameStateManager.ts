import type {
  AgentGameState,
  ExtendedGameState,
  StatusEffect,
  KillFeedEntry,
  TimeOfDay,
  Item,
} from "@/types/gameTypes";
import { AGENT_ABILITIES } from "@/config/abilities";
import { GAME_ITEMS, RARITY_DROP_WEIGHTS } from "@/config/items";
import type { GameEvent } from "@/lib/gameEngine";

// ============= ABILITY EFFECTS =============
const ABILITY_EFFECTS: Record<string, { type: "damage" | "heal" | "buff" | "debuff"; value: number; buffId?: string; buffDuration?: number }> = {
  // Shadow
  shadow_q: { type: "damage", value: 20 },
  shadow_w: { type: "buff", value: 0, buffId: "stealth", buffDuration: 1 },
  shadow_e: { type: "buff", value: 0, buffId: "insight", buffDuration: 1 },
  shadow_r: { type: "debuff", value: 0, buffId: "puppeted", buffDuration: 2 },
  // Blaze
  blaze_q: { type: "damage", value: 25 },
  blaze_w: { type: "buff", value: 0, buffId: "war_cry", buffDuration: 2 },
  blaze_e: { type: "buff", value: 0, buffId: "inferno_wall", buffDuration: 2 },
  blaze_r: { type: "buff", value: 0, buffId: "berserk", buffDuration: 2 },
  // Luna
  luna_q: { type: "heal", value: 20 },
  luna_w: { type: "debuff", value: 0, buffId: "charmed", buffDuration: 1 },
  luna_e: { type: "buff", value: 0, buffId: "silver_tongue", buffDuration: 1 },
  luna_r: { type: "debuff", value: 0, buffId: "eclipse", buffDuration: 2 },
  // Tank
  tank_q: { type: "damage", value: 15 },
  tank_w: { type: "buff", value: 0, buffId: "fortify", buffDuration: 2 },
  tank_e: { type: "buff", value: 0, buffId: "bodyguard", buffDuration: 2 },
  tank_r: { type: "buff", value: 0, buffId: "unbreakable", buffDuration: 1 },
  // Viper
  viper_q: { type: "debuff", value: 0, buffId: "poison", buffDuration: 2 },
  viper_w: { type: "buff", value: 0, buffId: "camouflage", buffDuration: 2 },
  viper_e: { type: "debuff", value: 0, buffId: "venom_trap", buffDuration: 1 },
  viper_r: { type: "damage", value: 30 },
  // Nova
  nova_q: { type: "heal", value: 18 },
  nova_w: { type: "buff", value: 0, buffId: "cosmic_shield", buffDuration: 2 },
  nova_e: { type: "buff", value: 0, buffId: "peace_treaty", buffDuration: 2 },
  nova_r: { type: "damage", value: 22 },
};

const BUFF_INFO: Record<string, { name: string; icon: string; type: "buff" | "debuff"; description: string }> = {
  stealth: { name: "Stealth", icon: "\uD83E\uDD77", type: "buff", description: "Hidden from the minimap" },
  insight: { name: "Dark Insight", icon: "\uD83D\uDC41\uFE0F", type: "buff", description: "Reading enemy intentions" },
  puppeted: { name: "Puppeted", icon: "\uD83C\uDFAD", type: "debuff", description: "Forced to betray an ally" },
  war_cry: { name: "War Cry", icon: "\uD83D\uDCE2", type: "buff", description: "+15 attack damage" },
  inferno_wall: { name: "Inferno Wall", icon: "\uD83E\uDDEF", type: "buff", description: "Blocking enemy approaches" },
  berserk: { name: "Berserk", icon: "\uD83D\uDCA2", type: "buff", description: "Double damage, +50% damage taken" },
  charmed: { name: "Charmed", icon: "\uD83D\uDC96", type: "debuff", description: "Cannot act against charmer" },
  silver_tongue: { name: "Silver Tongue", icon: "\uD83D\uDCAC", type: "buff", description: "Extra vote influence" },
  eclipse: { name: "Eclipse", icon: "\uD83C\uDF11", type: "debuff", description: "Alliances hidden" },
  fortify: { name: "Fortified", icon: "\uD83E\uDDF1", type: "buff", description: "-10 damage taken" },
  bodyguard: { name: "Bodyguard", icon: "\uD83E\uDD1D", type: "buff", description: "Redirecting damage from ally" },
  unbreakable: { name: "Unbreakable", icon: "\uD83D\uDCAA", type: "buff", description: "Invulnerable this round" },
  poison: { name: "Poisoned", icon: "\uD83D\uDC0D", type: "debuff", description: "Taking 10 damage per round" },
  camouflage: { name: "Camouflage", icon: "\uD83E\uDD8E", type: "buff", description: "Invisible on minimap" },
  venom_trap: { name: "Venom Trap", icon: "\uD83E\uDEE4", type: "debuff", description: "Trapped and poisoned" },
  cosmic_shield: { name: "Cosmic Shield", icon: "\uD83D\uDD2E", type: "buff", description: "-15 damage taken" },
  peace_treaty: { name: "Peace Treaty", icon: "\u2696\uFE0F", type: "buff", description: "Temporary truce active" },
  damage_boost: { name: "Damage Boost", icon: "\uD83D\uDD2A", type: "buff", description: "+15 attack damage" },
  armor_boost: { name: "Armored", icon: "\uD83D\uDEE1\uFE0F", type: "buff", description: "-10 damage taken" },
  alliance_buff: { name: "Alliance Bonded", icon: "\uD83D\uDC8D", type: "buff", description: "+20% loyalty" },
  immunity: { name: "Immunity", icon: "\uD83D\uDDFF", type: "buff", description: "Survive one elimination vote" },
  allied: { name: "Allied", icon: "\uD83E\uDD1D", type: "buff", description: "Allied with another agent" },
};

// ============= CONSTANTS =============
const BASE_HP = 100;
const BASE_MANA = 80;
const HP_PER_LEVEL = 10;
const MANA_PER_LEVEL = 8;
const XP_PER_ROUND = 20;
const XP_PER_KILL = 40;
const GOLD_PER_SURVIVE = 10;
const GOLD_PER_KILL = 25;
const GOLD_PER_ALLIANCE = 15;
const HP_REGEN_PER_ROUND = 5;
const MANA_REGEN_PER_ROUND = 10;
const MAX_INVENTORY_SLOTS = 6;

function xpThreshold(level: number): number {
  return level * 50;
}

// ============= INITIALIZE =============
export function initializeExtendedState(
  agentNames: string[]
): ExtendedGameState {
  const agentStates: Record<string, AgentGameState> = {};

  for (const name of agentNames) {
    const abilities = (AGENT_ABILITIES[name] || []).map((a) => ({
      ...a,
      currentCooldown: 0,
    }));

    agentStates[name] = {
      name,
      hp: BASE_HP,
      maxHp: BASE_HP,
      mana: BASE_MANA,
      maxMana: BASE_MANA,
      level: 1,
      xp: 0,
      xpToNext: xpThreshold(1),
      gold: 0,
      kills: 0,
      deaths: 0,
      assists: 0,
      abilities,
      items: [],
      statusEffects: [],
      isAlive: true,
    };
  }

  return {
    agentStates,
    timeOfDay: "day",
    roundNumber: 0,
    alliances: [],
    dangerZones: [],
  };
}

// ============= ABILITY & ITEM EXECUTION =============
function executeAbility(
  caster: AgentGameState,
  target: AgentGameState | null,
  abilityKey: string
): { success: boolean; message: string } {
  // Find the ability matching the key (Q/W/E/R)
  const ability = caster.abilities.find(
    (a) => a.key === abilityKey.toUpperCase() || a.id === abilityKey
  );
  if (!ability) return { success: false, message: "Ability not found" };
  if (ability.currentCooldown > 0) return { success: false, message: "Ability on cooldown" };
  if (caster.mana < ability.manaCost) return { success: false, message: "Not enough mana" };
  if (!caster.isAlive) return { success: false, message: "Agent is dead" };

  // Deduct mana and set cooldown
  caster.mana -= ability.manaCost;
  ability.currentCooldown = ability.cooldown;

  const effect = ABILITY_EFFECTS[ability.id];
  if (!effect) return { success: true, message: `${caster.name} used ${ability.name}` };

  // Check if caster has berserk (double damage)
  const hasBerserk = caster.statusEffects.some((se) => se.id === "berserk");

  if (effect.type === "damage" && target) {
    let damage = effect.value;
    if (hasBerserk) damage *= 2;

    // Check target defenses
    const hasFortify = target.statusEffects.some((se) => se.id === "fortify");
    const hasCosmicShield = target.statusEffects.some((se) => se.id === "cosmic_shield");
    const hasArmor = target.statusEffects.some((se) => se.id === "armor_boost");
    const hasUnbreakable = target.statusEffects.some((se) => se.id === "unbreakable");

    if (hasUnbreakable) {
      return { success: true, message: `${target.name} is UNBREAKABLE! No damage taken.` };
    }

    if (hasFortify) damage = Math.max(0, damage - 10);
    if (hasCosmicShield) damage = Math.max(0, damage - 15);
    if (hasArmor) damage = Math.max(0, damage - 10);

    // Check caster damage boost
    const hasDmgBoost = caster.statusEffects.some((se) => se.id === "damage_boost");
    if (hasDmgBoost) damage += 15;

    target.hp = Math.max(0, target.hp - damage);

    return { success: true, message: `${caster.name} hit ${target.name} with ${ability.name} for ${damage} damage!` };
  }

  if (effect.type === "heal") {
    const healTarget = target || caster;
    healTarget.hp = Math.min(healTarget.maxHp, healTarget.hp + effect.value);
    return { success: true, message: `${caster.name} healed ${healTarget.name} for ${effect.value} HP!` };
  }

  if ((effect.type === "buff" || effect.type === "debuff") && effect.buffId) {
    const buffTarget = effect.type === "debuff" && target ? target : caster;
    const info = BUFF_INFO[effect.buffId];
    if (info && !buffTarget.statusEffects.some((se) => se.id === effect.buffId)) {
      buffTarget.statusEffects.push({
        id: effect.buffId!,
        name: info.name,
        icon: info.icon,
        type: info.type,
        duration: effect.buffDuration || 2,
        description: info.description,
      });
    }
    return { success: true, message: `${caster.name} activated ${ability.name}!` };
  }

  return { success: true, message: `${caster.name} used ${ability.name}` };
}

function applyItemEffect(
  agent: AgentGameState,
  itemName: string,
  target?: AgentGameState
): { success: boolean; message: string } {
  const itemIdx = agent.items.findIndex(
    (i) => i.name.toLowerCase() === itemName.toLowerCase() || i.id === itemName
  );
  if (itemIdx === -1) return { success: false, message: "Item not found in inventory" };

  const item = agent.items[itemIdx];
  agent.items.splice(itemIdx, 1); // Remove item (single use)

  switch (item.effect) {
    case "damage_boost": {
      const info = BUFF_INFO["damage_boost"];
      agent.statusEffects.push({
        id: "damage_boost", name: info.name, icon: info.icon,
        type: "buff", duration: 2, description: info.description,
      });
      return { success: true, message: `${agent.name} used ${item.name}! +15 damage for 2 rounds.` };
    }
    case "heal": {
      agent.hp = Math.min(agent.maxHp, agent.hp + 20);
      return { success: true, message: `${agent.name} consumed ${item.name}! +20 HP restored.` };
    }
    case "armor_boost": {
      const info = BUFF_INFO["armor_boost"];
      agent.statusEffects.push({
        id: "armor_boost", name: info.name, icon: info.icon,
        type: "buff", duration: 3, description: info.description,
      });
      return { success: true, message: `${agent.name} equipped ${item.name}! -10 damage taken for 3 rounds.` };
    }
    case "poison": {
      const attackTarget = target || agent;
      const info = BUFF_INFO["poison"];
      attackTarget.statusEffects.push({
        id: "poison", name: info.name, icon: info.icon,
        type: "debuff", duration: 2, description: info.description,
      });
      return { success: true, message: `${agent.name} applied ${item.name}!` };
    }
    case "alliance_boost": {
      const info = BUFF_INFO["alliance_buff"];
      agent.statusEffects.push({
        id: "alliance_buff", name: info.name, icon: info.icon,
        type: "buff", duration: 3, description: info.description,
      });
      return { success: true, message: `${agent.name} used ${item.name}! Alliance bonds strengthened.` };
    }
    case "immunity": {
      const info = BUFF_INFO["immunity"];
      agent.statusEffects.push({
        id: "immunity", name: info.name, icon: info.icon,
        type: "buff", duration: 99, description: info.description,
      });
      return { success: true, message: `${agent.name} found the IMMUNITY IDOL!` };
    }
    default:
      return { success: false, message: "Unknown item effect" };
  }
}

// ============= PROCESS ROUND =============
export function processRoundResults(
  state: ExtendedGameState,
  roundEvents: GameEvent[],
  aliveNames: string[],
  eliminatedNames: string[]
): { state: ExtendedGameState; killFeed: KillFeedEntry[] } {
  const newState = { ...state };
  newState.agentStates = { ...state.agentStates };
  const killFeed: KillFeedEntry[] = [];

  // Deep copy agent states
  for (const name of Object.keys(newState.agentStates)) {
    newState.agentStates[name] = {
      ...newState.agentStates[name],
      abilities: newState.agentStates[name].abilities.map((a) => ({ ...a })),
      items: [...newState.agentStates[name].items],
      statusEffects: [...newState.agentStates[name].statusEffects],
    };
  }

  newState.roundNumber++;

  // Toggle day/night
  newState.timeOfDay = state.timeOfDay === "day" ? "night" : "day";

  // Update alliances from events
  const newAlliances: [string, string][] = [...state.alliances];
  const betrayals: Set<string> = new Set();

  for (const event of roundEvents) {
    if (event.type === "alliance" && event.target) {
      const pair: [string, string] = [event.agentName, event.target].sort() as [string, string];
      if (!newAlliances.some(([a, b]) => a === pair[0] && b === pair[1])) {
        newAlliances.push(pair);
      }
    }
    if (event.type === "betrayal" && event.target) {
      betrayals.add(event.agentName);
      // Remove alliances involving the betrayer
      const filtered = newAlliances.filter(
        ([a, b]) => a !== event.agentName && b !== event.agentName
      );
      newAlliances.length = 0;
      newAlliances.push(...filtered);
    }
  }
  newState.alliances = newAlliances;

  // Process each alive agent
  for (const name of Object.keys(newState.agentStates)) {
    const agent = newState.agentStates[name];

    // Mark dead agents
    if (eliminatedNames.includes(name)) {
      agent.isAlive = false;
      agent.deaths++;
      agent.hp = 0;

      // Find who eliminated them (check events)
      const elimEvent = roundEvents.find(
        (e) => e.type === "elimination" && e.agentName === name
      );
      // Look for a betrayal or action targeting this agent
      const killerEvent = roundEvents.find(
        (e) =>
          (e.type === "betrayal" || e.type === "action") &&
          e.target === name &&
          e.agentName !== name
      );
      const killerName = killerEvent?.agentName || "Island";
      const killerAbility = killerEvent
        ? newState.agentStates[killerName]?.abilities[0]
        : null;

      if (newState.agentStates[killerName] && killerName !== "Island") {
        newState.agentStates[killerName].kills++;
        newState.agentStates[killerName].xp += XP_PER_KILL;
        newState.agentStates[killerName].gold += GOLD_PER_KILL;
      }

      killFeed.push({
        id: `kill_${Date.now()}_${name}`,
        timestamp: Date.now(),
        killerName,
        victimName: name,
        abilityIcon: killerAbility?.icon || "\u2620\uFE0F",
        abilityName: killerAbility?.name || "Vote",
        goldEarned: GOLD_PER_KILL,
      });

      continue;
    }

    if (!aliveNames.includes(name)) continue;

    // Survival gold & XP
    agent.gold += GOLD_PER_SURVIVE;
    agent.xp += XP_PER_ROUND;

    // Alliance gold
    const hasAlliance = newAlliances.some(
      ([a, b]) => a === name || b === name
    );
    if (hasAlliance) {
      agent.gold += GOLD_PER_ALLIANCE;
    }

    // HP/Mana regen
    agent.hp = Math.min(agent.maxHp, agent.hp + HP_REGEN_PER_ROUND);
    agent.mana = Math.min(agent.maxMana, agent.mana + MANA_REGEN_PER_ROUND);

    // Process status effects (decrement durations, remove expired)
    agent.statusEffects = agent.statusEffects
      .map((se) => ({ ...se, duration: se.duration - 1 }))
      .filter((se) => se.duration > 0);

    // Poison damage from debuffs
    const poisoned = agent.statusEffects.find((se) => se.id === "poison");
    if (poisoned) {
      agent.hp = Math.max(1, agent.hp - 10);
    }

    // Cooldown reduction
    agent.abilities = agent.abilities.map((a) => ({
      ...a,
      currentCooldown: Math.max(0, a.currentCooldown - 1),
    }));

    // Level up check
    while (agent.xp >= agent.xpToNext && agent.level < 10) {
      agent.xp -= agent.xpToNext;
      agent.level++;
      agent.xpToNext = xpThreshold(agent.level);
      agent.maxHp = BASE_HP + HP_PER_LEVEL * (agent.level - 1);
      agent.maxMana = BASE_MANA + MANA_PER_LEVEL * (agent.level - 1);
      agent.hp = agent.maxHp; // Full heal on level up
      agent.mana = agent.maxMana;
    }

    // Random item drop (30% chance per round for alive agents)
    if (Math.random() < 0.3 && agent.items.length < MAX_INVENTORY_SLOTS) {
      const item = rollRandomItem();
      if (item) {
        agent.items.push(item);
        // Apply immediate effects
        if (item.effect === "heal") {
          agent.hp = Math.min(agent.maxHp, agent.hp + 20);
        }
      }
    }

    // Execute abilities and items from action events
    const agentActions = roundEvents.filter(
      (e) => e.agentName === name && e.type === "action"
    );
    for (const action of agentActions) {
      // Execute ability if one was used
      if (action.abilityUsed) {
        const targetAgent = action.target ? newState.agentStates[action.target] : null;
        executeAbility(agent, targetAgent || null, action.abilityUsed);

        // Check if target was killed by ability
        if (targetAgent && targetAgent.hp <= 0 && targetAgent.isAlive) {
          targetAgent.isAlive = false;
          targetAgent.deaths++;
          agent.kills++;
          agent.xp += XP_PER_KILL;
          agent.gold += GOLD_PER_KILL;
          killFeed.push({
            id: `kill_${Date.now()}_${targetAgent.name}`,
            timestamp: Date.now(),
            killerName: name,
            victimName: targetAgent.name,
            abilityIcon: agent.abilities.find((a) => a.key === action.abilityUsed?.toUpperCase() || a.id === action.abilityUsed)?.icon || "\u2694\uFE0F",
            abilityName: agent.abilities.find((a) => a.key === action.abilityUsed?.toUpperCase() || a.id === action.abilityUsed)?.name || "Attack",
            goldEarned: GOLD_PER_KILL,
          });
        }
      }

      // Use item if one was used
      if (action.itemUsed) {
        const targetAgent = action.target ? newState.agentStates[action.target] : undefined;
        applyItemEffect(agent, action.itemUsed, targetAgent);
      }

      // Action-based buffs
      if (action.content.includes("lay_low")) {
        const info = BUFF_INFO["stealth"];
        if (info && !agent.statusEffects.find((se) => se.id === "stealth")) {
          agent.statusEffects.push({
            id: "stealth", name: info.name, icon: info.icon,
            type: info.type, duration: 1, description: info.description,
          });
        }
      }
      if (action.content.includes("alliance") || action.content.includes("form_alliance")) {
        const info = BUFF_INFO["allied"];
        if (info && !agent.statusEffects.find((se) => se.id === "allied")) {
          agent.statusEffects.push({
            id: "allied", name: info.name, icon: info.icon,
            type: info.type, duration: 2, description: info.description,
          });
        }
      }
    }
  }

  // Generate danger zones (random positions on map)
  newState.dangerZones = [];
  if (newState.timeOfDay === "night") {
    const numZones = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < numZones; i++) {
      newState.dangerZones.push({
        x: (Math.random() - 0.5) * 20,
        z: (Math.random() - 0.5) * 20,
        radius: 3 + Math.random() * 3,
      });
    }

    // Danger zone damage: ~30% of alive agents take 15 HP
    const aliveAgentNames = Object.keys(newState.agentStates).filter(
      (n) => newState.agentStates[n].isAlive && aliveNames.includes(n)
    );
    for (const agentName of aliveAgentNames) {
      if (Math.random() < 0.3) {
        const agent = newState.agentStates[agentName];
        const hasUnbreakable = agent.statusEffects.some((se) => se.id === "unbreakable");
        if (!hasUnbreakable) {
          agent.hp = Math.max(1, agent.hp - 15);
        }
      }
    }
  }

  return { state: newState, killFeed };
}

// ============= HELPERS =============
function rollRandomItem(): Item | null {
  const totalWeight = Object.values(RARITY_DROP_WEIGHTS).reduce(
    (a, b) => a + b,
    0
  );
  let roll = Math.random() * totalWeight;

  for (const [rarity, weight] of Object.entries(RARITY_DROP_WEIGHTS)) {
    roll -= weight;
    if (roll <= 0) {
      const matchingItems = GAME_ITEMS.filter((i) => i.rarity === rarity);
      if (matchingItems.length > 0) {
        return {
          ...matchingItems[Math.floor(Math.random() * matchingItems.length)],
        };
      }
    }
  }

  return null;
}
