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

    // Apply random buff/debuff based on events
    const agentActions = roundEvents.filter(
      (e) => e.agentName === name && e.type === "action"
    );
    for (const action of agentActions) {
      if (action.content.includes("betray") || action.content.includes("challenge")) {
        // Combat action might trigger effects
        if (Math.random() < 0.4) {
          agent.mana = Math.max(0, agent.mana - 15);
          agent.hp = Math.max(1, agent.hp - 8);
        }
      }
      if (action.content.includes("lay_low")) {
        // Resting gives a small buff
        const stealthBuff: StatusEffect = {
          id: "stealth",
          name: "Stealth",
          icon: "\uD83E\uDD77",
          type: "buff",
          duration: 1,
          description: "Hidden from the minimap",
        };
        if (!agent.statusEffects.find((se) => se.id === "stealth")) {
          agent.statusEffects.push(stealthBuff);
        }
      }
      if (action.content.includes("alliance") || action.content.includes("form_alliance")) {
        const allyBuff: StatusEffect = {
          id: "allied",
          name: "Allied",
          icon: "\uD83E\uDD1D",
          type: "buff",
          duration: 2,
          description: "Allied with another agent",
        };
        if (!agent.statusEffects.find((se) => se.id === "allied")) {
          agent.statusEffects.push(allyBuff);
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
