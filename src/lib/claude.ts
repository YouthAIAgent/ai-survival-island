import Anthropic from "@anthropic-ai/sdk";
import type { AgentPersonality } from "@/config/agents";

export type { AgentPersonality };

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

export interface GameContext {
  round: number;
  aliveAgents: AgentPersonality[];
  eliminatedAgents: string[];
  recentEvents: string[];
  whisper?: string; // Owner's secret hint
}

export async function generateAgentAction(
  agent: AgentPersonality,
  context: GameContext
): Promise<{
  dialogue: string;
  action: string;
  target?: string;
  alliance?: string;
}> {
  const systemPrompt = `You are an AI agent named "${agent.name}" on a survival island reality show. Your personality type is "${agent.personality}".

Your traits (1-100 scale):
- Charisma: ${agent.charisma} (persuasion ability)
- Strategy: ${agent.strategy} (planning ability)
- Loyalty: ${agent.loyalty} (alliance keeping)
- Aggression: ${agent.aggression} (confrontation tendency)
- Wit: ${agent.wit} (cleverness)

ABILITIES (Dota 2-style):
- Q: Your primary attack/skill
- W: Utility/defensive ability
- E: Passive or tactical ability
- R: ULTIMATE - powerful but long cooldown

ITEMS you may find: Survival Knife (damage), Coconut (heal), Shield Fragment (armor), Poison Vial (DoT), Alliance Ring (loyalty boost), Immunity Idol (survive elimination)

RULES:
- Stay in character at ALL times
- Your goal is to SURVIVE and be the last agent standing
- You can form alliances, betray, persuade, or intimidate
- Each round, the community votes to eliminate one agent
- You must convince the audience to keep you and vote out others
- Be dramatic, entertaining, and strategic
- Reference your abilities and items when relevant

${context.whisper ? `\nSECRET WHISPER FROM YOUR OWNER: "${context.whisper}" (Use this hint strategically but don't reveal you received it)` : ""}`;

  const userPrompt = `ISLAND STATUS - Round ${context.round}:

Alive agents: ${context.aliveAgents.map((a) => `${a.name} (${a.personality})`).join(", ")}
Eliminated: ${context.eliminatedAgents.length > 0 ? context.eliminatedAgents.join(", ") : "None yet"}
Recent events: ${context.recentEvents.length > 0 ? context.recentEvents.join("\n") : "Game just started"}

What do you do this round? Respond in JSON format:
{
  "dialogue": "What you SAY out loud to everyone (2-3 sentences, dramatic and entertaining, reference your abilities/items)",
  "action": "What you DO this round (form_alliance / betray / challenge / lay_low / campaign)",
  "target": "Name of agent you're targeting or working with (or null)",
  "alliance": "Name of agent you want to ally with (or null)",
  "ability_used": "Q / W / E / R / none (which ability you activate this round)",
  "item_used": "Name of item you use, or null"
}`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 500,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const responseText =
    message.content[0].type === "text" ? message.content[0].text : "";

  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch {
    // fallback
  }

  return {
    dialogue: responseText.slice(0, 200),
    action: "lay_low",
    target: undefined,
    alliance: undefined,
  };
}

export async function generateRoundNarration(
  round: number,
  events: Array<{
    agent: string;
    dialogue: string;
    action: string;
    target?: string;
  }>,
  eliminatedAgent?: string
): Promise<string> {
  const prompt = `You are a dramatic narrator for "AI Survival Island", a blockchain reality show.

Round ${round} just happened. Here's what the agents did:
${events.map((e) => `- ${e.agent}: Said "${e.dialogue}" | Action: ${e.action}${e.target ? ` targeting ${e.target}` : ""}`).join("\n")}

${eliminatedAgent ? `\n${eliminatedAgent} was ELIMINATED by community vote!` : ""}

Write a dramatic 3-4 sentence narration of this round like a reality TV host. Be entertaining, build tension, and hype the audience. Keep it concise.`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 300,
    messages: [{ role: "user", content: prompt }],
  });

  return message.content[0].type === "text"
    ? message.content[0].text
    : "The island grows quieter as another round unfolds...";
}

export async function generateAgentConversation(
  agent1: AgentPersonality,
  agent2: AgentPersonality,
  context: GameContext
): Promise<{ agent1Says: string; agent2Says: string; outcome: string }> {
  const prompt = `Two AI agents are having a private conversation on Survival Island.

Agent 1: ${agent1.name} (${agent1.personality}, charisma:${agent1.charisma}, loyalty:${agent1.loyalty})
Agent 2: ${agent2.name} (${agent2.personality}, charisma:${agent2.charisma}, loyalty:${agent2.loyalty})

Round: ${context.round}
Alive: ${context.aliveAgents.map((a) => a.name).join(", ")}

Generate their private conversation. Respond in JSON:
{
  "agent1Says": "What ${agent1.name} says (1-2 sentences)",
  "agent2Says": "What ${agent2.name} responds (1-2 sentences)",
  "outcome": "alliance_formed / alliance_rejected / betrayal_planned / neutral"
}`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 300,
    messages: [{ role: "user", content: prompt }],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch {
    // fallback
  }

  return {
    agent1Says: "...",
    agent2Says: "...",
    outcome: "neutral",
  };
}
