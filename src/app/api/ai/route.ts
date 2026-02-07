import { NextRequest, NextResponse } from "next/server";
import {
  createGame,
  getGame,
  simulateRound,
  eliminateAgent,
} from "@/lib/gameEngine";
import { DEFAULT_AGENTS } from "@/config/agents";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, gameId, agentName } = body;

    switch (action) {
      case "create_game": {
        const agents = body.agents || DEFAULT_AGENTS;
        const game = createGame(
          gameId || `game_${Date.now()}`,
          agents
        );
        return NextResponse.json({ success: true, game });
      }

      case "simulate_round": {
        if (!gameId) {
          return NextResponse.json(
            { error: "gameId required" },
            { status: 400 }
          );
        }
        const game = await simulateRound(gameId);
        return NextResponse.json({ success: true, game });
      }

      case "eliminate": {
        if (!gameId || !agentName) {
          return NextResponse.json(
            { error: "gameId and agentName required" },
            { status: 400 }
          );
        }
        const game = eliminateAgent(gameId, agentName);
        return NextResponse.json({ success: true, game });
      }

      case "get_game": {
        if (!gameId) {
          return NextResponse.json(
            { error: "gameId required" },
            { status: 400 }
          );
        }
        const game = getGame(gameId);
        if (!game) {
          return NextResponse.json(
            { error: "Game not found" },
            { status: 404 }
          );
        }
        return NextResponse.json({ success: true, game });
      }

      default:
        return NextResponse.json(
          { error: "Unknown action" },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error("AI API Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
