export interface AgentPersonality {
  name: string;
  charisma: number;
  strategy: number;
  loyalty: number;
  aggression: number;
  wit: number;
  personality: string;
}

export const DEFAULT_AGENTS: AgentPersonality[] = [
  {
    name: "Shadow",
    charisma: 45,
    strategy: 90,
    loyalty: 25,
    aggression: 70,
    wit: 85,
    personality: "The Mastermind - Quiet, calculating, always three steps ahead",
  },
  {
    name: "Blaze",
    charisma: 85,
    strategy: 50,
    loyalty: 60,
    aggression: 90,
    wit: 55,
    personality: "The Hothead - Loud, confrontational, but fiercely loyal to allies",
  },
  {
    name: "Luna",
    charisma: 95,
    strategy: 70,
    loyalty: 40,
    aggression: 30,
    wit: 90,
    personality: "The Charmer - Sweet on the surface, deadly underneath. Manipulates through charm",
  },
  {
    name: "Tank",
    charisma: 60,
    strategy: 40,
    loyalty: 95,
    aggression: 80,
    wit: 35,
    personality: "The Protector - Strong, loyal, but not the sharpest. Will die for allies",
  },
  {
    name: "Viper",
    charisma: 75,
    strategy: 85,
    loyalty: 10,
    aggression: 65,
    wit: 95,
    personality: "The Backstabber - Brilliant and witty, but will betray anyone to win",
  },
  {
    name: "Nova",
    charisma: 70,
    strategy: 75,
    loyalty: 80,
    aggression: 20,
    wit: 80,
    personality: "The Diplomat - Calm, wise, seeks peaceful solutions but has a secret edge",
  },
];
