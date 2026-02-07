import {
  generateAgentAction,
  generateRoundNarration,
  generateAgentConversation,
  type GameContext,
} from "./claude";
import { DEFAULT_AGENTS } from "@/config/agents";
import type { AgentPersonality } from "@/config/agents";

export interface GameEvent {
  timestamp: number;
  round: number;
  type:
    | "action"
    | "dialogue"
    | "alliance"
    | "betrayal"
    | "elimination"
    | "narration"
    | "conversation";
  agentName: string;
  content: string;
  target?: string;
}

export interface GameState {
  gameId: string;
  round: number;
  status: "waiting" | "active" | "voting" | "ended";
  agents: AgentPersonality[];
  aliveAgentNames: string[];
  eliminatedAgentNames: string[];
  events: GameEvent[];
  narration: string;
  winner?: string;
  // Extended Dota 2-style state (optional, managed client-side)
  timeOfDay?: "day" | "night";
  agentStates?: Record<string, unknown>;
}

// In-memory game state (would use DB in production)
const activeGames = new Map<string, GameState>();

export function createGame(
  gameId: string,
  agents: AgentPersonality[]
): GameState {
  const state: GameState = {
    gameId,
    round: 0,
    status: "waiting",
    agents,
    aliveAgentNames: agents.map((a) => a.name),
    eliminatedAgentNames: [],
    events: [],
    narration:
      "Welcome to AI Survival Island! The agents have arrived and the game is about to begin...",
  };

  activeGames.set(gameId, state);
  return state;
}

export function getGame(gameId: string): GameState | undefined {
  return activeGames.get(gameId);
}

export async function simulateRound(gameId: string): Promise<GameState> {
  const game = activeGames.get(gameId);
  if (!game) throw new Error("Game not found");
  if (game.status === "ended") throw new Error("Game already ended");

  game.round++;
  game.status = "active";

  const aliveAgents = game.agents.filter((a) =>
    game.aliveAgentNames.includes(a.name)
  );

  const context: GameContext = {
    round: game.round,
    aliveAgents,
    eliminatedAgents: game.eliminatedAgentNames,
    recentEvents: game.events.slice(-5).map((e) => `${e.agentName}: ${e.content}`),
  };

  // Each agent takes an action
  const roundActions: Array<{
    agent: string;
    dialogue: string;
    action: string;
    target?: string;
  }> = [];

  for (const agent of aliveAgents) {
    const agentContext = { ...context };
    const action = await generateAgentAction(agent, agentContext);

    game.events.push({
      timestamp: Date.now(),
      round: game.round,
      type: "dialogue",
      agentName: agent.name,
      content: action.dialogue,
    });

    game.events.push({
      timestamp: Date.now(),
      round: game.round,
      type: "action",
      agentName: agent.name,
      content: action.action,
      target: action.target || undefined,
    });

    if (action.alliance) {
      game.events.push({
        timestamp: Date.now(),
        round: game.round,
        type: "alliance",
        agentName: agent.name,
        content: `Attempted alliance with ${action.alliance}`,
        target: action.alliance,
      });
    }

    roundActions.push({
      agent: agent.name,
      dialogue: action.dialogue,
      action: action.action,
      target: action.target || undefined,
    });
  }

  // Generate random conversations between 2 agents
  if (aliveAgents.length >= 2) {
    const idx1 = Math.floor(Math.random() * aliveAgents.length);
    let idx2 = Math.floor(Math.random() * aliveAgents.length);
    while (idx2 === idx1) idx2 = Math.floor(Math.random() * aliveAgents.length);

    const convo = await generateAgentConversation(
      aliveAgents[idx1],
      aliveAgents[idx2],
      context
    );

    game.events.push({
      timestamp: Date.now(),
      round: game.round,
      type: "conversation",
      agentName: aliveAgents[idx1].name,
      content: convo.agent1Says,
      target: aliveAgents[idx2].name,
    });

    game.events.push({
      timestamp: Date.now(),
      round: game.round,
      type: "conversation",
      agentName: aliveAgents[idx2].name,
      content: convo.agent2Says,
      target: aliveAgents[idx1].name,
    });
  }

  // Generate narration
  const narration = await generateRoundNarration(game.round, roundActions);
  game.narration = narration;

  game.events.push({
    timestamp: Date.now(),
    round: game.round,
    type: "narration",
    agentName: "Narrator",
    content: narration,
  });

  // Move to voting phase
  game.status = "voting";

  activeGames.set(gameId, game);
  return game;
}

export function eliminateAgent(gameId: string, agentName: string): GameState {
  const game = activeGames.get(gameId);
  if (!game) throw new Error("Game not found");

  game.aliveAgentNames = game.aliveAgentNames.filter((n) => n !== agentName);
  game.eliminatedAgentNames.push(agentName);

  game.events.push({
    timestamp: Date.now(),
    round: game.round,
    type: "elimination",
    agentName: agentName,
    content: `${agentName} has been voted off the island!`,
  });

  // Check if game is over
  if (game.aliveAgentNames.length <= 1) {
    game.status = "ended";
    game.winner = game.aliveAgentNames[0] || "No winner";
    game.events.push({
      timestamp: Date.now(),
      round: game.round,
      type: "narration",
      agentName: "Narrator",
      content: `${game.winner} is the LAST SURVIVOR and wins the island! Congratulations!`,
    });
  } else {
    game.status = "active";
  }

  activeGames.set(gameId, game);
  return game;
}

