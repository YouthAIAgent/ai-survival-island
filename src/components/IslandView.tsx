"use client";

interface GameEvent {
  timestamp: number;
  round: number;
  type: string;
  agentName: string;
  content: string;
  target?: string;
}

interface IslandViewProps {
  events: GameEvent[];
  narration: string;
  round: number;
  status: string;
}

function EventBubble({ event }: { event: GameEvent }) {
  const typeStyles: Record<string, string> = {
    dialogue: "border-blue-500 bg-blue-900/20",
    action: "border-yellow-500 bg-yellow-900/20",
    alliance: "border-green-500 bg-green-900/20",
    betrayal: "border-red-500 bg-red-900/20",
    elimination: "border-red-600 bg-red-900/40",
    narration: "border-purple-500 bg-purple-900/20",
    conversation: "border-cyan-500 bg-cyan-900/20",
  };

  const typeIcons: Record<string, string> = {
    dialogue: "💬",
    action: "⚡",
    alliance: "🤝",
    betrayal: "🗡️",
    elimination: "💀",
    narration: "📢",
    conversation: "🗣️",
  };

  return (
    <div
      className={`animate-slide-up border-l-2 ${
        typeStyles[event.type] || "border-gray-500 bg-gray-900/20"
      } rounded-r-lg p-3 mb-2`}
    >
      <div className="flex items-center gap-2 mb-1">
        <span>{typeIcons[event.type] || "📋"}</span>
        <span className="text-sm font-bold text-white">{event.agentName}</span>
        {event.target && (
          <span className="text-xs text-gray-400">→ {event.target}</span>
        )}
        <span className="ml-auto text-xs text-gray-500">R{event.round}</span>
      </div>
      <p className="text-sm text-gray-300">{event.content}</p>
    </div>
  );
}

export default function IslandView({
  events,
  narration,
  round,
  status,
}: IslandViewProps) {
  const statusColors: Record<string, string> = {
    waiting: "text-yellow-400",
    active: "text-green-400",
    voting: "text-red-400",
    ended: "text-gray-400",
  };

  return (
    <div className="glass-card rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-white">Island Events</h2>
          <p className="text-sm text-gray-400">
            Round {round} •{" "}
            <span className={statusColors[status] || "text-gray-400"}>
              {status.toUpperCase()}
            </span>
          </p>
        </div>
        <div className="text-3xl animate-float">🏝️</div>
      </div>

      {/* Narration */}
      {narration && (
        <div className="bg-purple-900/30 border border-purple-500/30 rounded-lg p-4 mb-4">
          <p className="text-sm text-purple-200 italic">{narration}</p>
        </div>
      )}

      {/* Events Feed */}
      <div className="max-h-[500px] overflow-y-auto space-y-2 pr-2 scrollbar-thin">
        {events.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            Waiting for the game to begin...
          </p>
        ) : (
          [...events]
            .reverse()
            .map((event, idx) => <EventBubble key={idx} event={event} />)
        )}
      </div>
    </div>
  );
}
