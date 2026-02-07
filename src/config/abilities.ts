import type { Ability } from "@/types/gameTypes";

// 4 abilities per agent (Q/W/E/R)
export const AGENT_ABILITIES: Record<string, Ability[]> = {
  Shadow: [
    { id: "shadow_q", name: "Shadow Strike", key: "Q", icon: "\uD83D\uDDE1\uFE0F", description: "A precise strike from the shadows. Deals damage and reveals target's alliances.", cooldown: 2, currentCooldown: 0, manaCost: 25, isPassive: false },
    { id: "shadow_w", name: "Smoke Screen", key: "W", icon: "\uD83C\uDF2B\uFE0F", description: "Creates a veil of smoke, hiding your actions for one round.", cooldown: 3, currentCooldown: 0, manaCost: 30, isPassive: false },
    { id: "shadow_e", name: "Dark Insight", key: "E", icon: "\uD83D\uDC41\uFE0F", description: "Read another agent's true intentions this round.", cooldown: 2, currentCooldown: 0, manaCost: 20, isPassive: false },
    { id: "shadow_r", name: "Puppet Master", key: "R", icon: "\uD83C\uDFAD", description: "ULTIMATE: Force a target to betray their strongest ally.", cooldown: 5, currentCooldown: 0, manaCost: 60, isPassive: false },
  ],
  Blaze: [
    { id: "blaze_q", name: "Fireball", key: "Q", icon: "\uD83D\uDD25", description: "Hurl a fireball at a target, dealing heavy damage.", cooldown: 2, currentCooldown: 0, manaCost: 30, isPassive: false },
    { id: "blaze_w", name: "War Cry", key: "W", icon: "\uD83D\uDCE2", description: "Rally allies, giving them a temporary attack buff.", cooldown: 3, currentCooldown: 0, manaCost: 25, isPassive: false },
    { id: "blaze_e", name: "Inferno Wall", key: "E", icon: "\uD83E\uDDEF", description: "Create a wall of fire that blocks enemy approaches.", cooldown: 3, currentCooldown: 0, manaCost: 35, isPassive: false },
    { id: "blaze_r", name: "Berserker Rage", key: "R", icon: "\uD83D\uDCA2", description: "ULTIMATE: Enter a rage state. Double damage but take 50% more.", cooldown: 5, currentCooldown: 0, manaCost: 50, isPassive: false },
  ],
  Luna: [
    { id: "luna_q", name: "Moonbeam", key: "Q", icon: "\uD83C\uDF19", description: "Channel moonlight to heal yourself or an ally.", cooldown: 2, currentCooldown: 0, manaCost: 25, isPassive: false },
    { id: "luna_w", name: "Charm", key: "W", icon: "\uD83D\uDC96", description: "Charm a target, preventing them from acting against you.", cooldown: 3, currentCooldown: 0, manaCost: 30, isPassive: false },
    { id: "luna_e", name: "Silver Tongue", key: "E", icon: "\uD83D\uDCAC", description: "Manipulate the vote, adding extra weight to your choice.", cooldown: 3, currentCooldown: 0, manaCost: 20, isPassive: false },
    { id: "luna_r", name: "Eclipse", key: "R", icon: "\uD83C\uDF11", description: "ULTIMATE: Plunge the island into darkness. All alliances are hidden.", cooldown: 5, currentCooldown: 0, manaCost: 55, isPassive: false },
  ],
  Tank: [
    { id: "tank_q", name: "Shield Bash", key: "Q", icon: "\uD83D\uDEE1\uFE0F", description: "Bash a target with your shield, stunning them.", cooldown: 2, currentCooldown: 0, manaCost: 20, isPassive: false },
    { id: "tank_w", name: "Fortify", key: "W", icon: "\uD83E\uDDF1", description: "Increase your defense, reducing incoming damage.", cooldown: 3, currentCooldown: 0, manaCost: 25, isPassive: false },
    { id: "tank_e", name: "Bodyguard", key: "E", icon: "\uD83E\uDD1D", description: "Protect an ally, redirecting attacks against them to you.", cooldown: 2, currentCooldown: 0, manaCost: 30, isPassive: false },
    { id: "tank_r", name: "Unbreakable", key: "R", icon: "\uD83D\uDCAA", description: "ULTIMATE: Become invulnerable for one round. Cannot be eliminated.", cooldown: 6, currentCooldown: 0, manaCost: 60, isPassive: false },
  ],
  Viper: [
    { id: "viper_q", name: "Poison Fang", key: "Q", icon: "\uD83D\uDC0D", description: "Inject venom that deals damage over 2 rounds.", cooldown: 2, currentCooldown: 0, manaCost: 25, isPassive: false },
    { id: "viper_w", name: "Camouflage", key: "W", icon: "\uD83E\uDD8E", description: "Blend into surroundings, becoming invisible on the minimap.", cooldown: 3, currentCooldown: 0, manaCost: 20, isPassive: false },
    { id: "viper_e", name: "Venom Trap", key: "E", icon: "\uD83E\uDEE4", description: "Set a trap that poisons the next agent who passes by.", cooldown: 3, currentCooldown: 0, manaCost: 30, isPassive: false },
    { id: "viper_r", name: "Venomstrike", key: "R", icon: "\u2620\uFE0F", description: "ULTIMATE: A devastating poison that deals massive damage and silences.", cooldown: 5, currentCooldown: 0, manaCost: 55, isPassive: false },
  ],
  Nova: [
    { id: "nova_q", name: "Starlight", key: "Q", icon: "\u2728", description: "Heal an ally with starlight energy.", cooldown: 2, currentCooldown: 0, manaCost: 20, isPassive: false },
    { id: "nova_w", name: "Cosmic Shield", key: "W", icon: "\uD83D\uDD2E", description: "Create a shield around yourself or an ally.", cooldown: 3, currentCooldown: 0, manaCost: 30, isPassive: false },
    { id: "nova_e", name: "Peace Treaty", key: "E", icon: "\u2696\uFE0F", description: "Force two agents into a temporary truce.", cooldown: 3, currentCooldown: 0, manaCost: 25, isPassive: false },
    { id: "nova_r", name: "Supernova", key: "R", icon: "\uD83C\uDF1F", description: "ULTIMATE: A massive explosion of light. Damages all enemies nearby.", cooldown: 6, currentCooldown: 0, manaCost: 65, isPassive: false },
  ],
};
