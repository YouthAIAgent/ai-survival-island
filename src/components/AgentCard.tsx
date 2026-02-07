"use client";

interface AgentCardProps {
  name: string;
  personality: string;
  charisma: number;
  strategy: number;
  loyalty: number;
  aggression: number;
  wit: number;
  isAlive: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  dialogue?: string;
  showStats?: boolean;
}

const PERSONALITY_COLORS: Record<string, string> = {
  Mastermind: "from-purple-500 to-indigo-600",
  Hothead: "from-red-500 to-orange-600",
  Charmer: "from-pink-500 to-rose-600",
  Protector: "from-blue-500 to-cyan-600",
  Backstabber: "from-green-500 to-emerald-600",
  Diplomat: "from-yellow-500 to-amber-600",
};

function getColorClass(personality: string): string {
  for (const [key, value] of Object.entries(PERSONALITY_COLORS)) {
    if (personality.toLowerCase().includes(key.toLowerCase())) return value;
  }
  return "from-gray-500 to-gray-600";
}

function StatBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-400 w-16">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-red-500 to-red-300 transition-all duration-500"
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs text-gray-500 w-6 text-right">{value}</span>
    </div>
  );
}

export default function AgentCard({
  name,
  personality,
  charisma,
  strategy,
  loyalty,
  aggression,
  wit,
  isAlive,
  isSelected,
  onClick,
  dialogue,
  showStats = true,
}: AgentCardProps) {
  const colorClass = getColorClass(personality);

  return (
    <div
      onClick={onClick}
      className={`glass-card rounded-xl p-4 transition-all duration-300 ${
        !isAlive ? "opacity-40 grayscale" : "hover:scale-[1.02]"
      } ${isSelected ? "ring-2 ring-red-500 animate-pulse-glow" : ""} ${
        onClick ? "cursor-pointer" : ""
      }`}
    >
      {/* Agent Avatar */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className={`w-12 h-12 rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center text-white font-bold text-lg ${
            isAlive ? "animate-float" : ""
          }`}
        >
          {name[0]}
        </div>
        <div>
          <h3 className="font-bold text-white">{name}</h3>
          <p className="text-xs text-gray-400">{personality}</p>
        </div>
        {!isAlive && (
          <span className="ml-auto text-xs bg-red-900/50 text-red-400 px-2 py-1 rounded">
            ELIMINATED
          </span>
        )}
        {isAlive && (
          <span className="ml-auto text-xs bg-green-900/50 text-green-400 px-2 py-1 rounded">
            ALIVE
          </span>
        )}
      </div>

      {/* Dialogue Bubble */}
      {dialogue && (
        <div className="bg-gray-800/50 rounded-lg p-3 mb-3 border-l-2 border-red-500">
          <p className="text-sm text-gray-300 italic">&quot;{dialogue}&quot;</p>
        </div>
      )}

      {/* Stats */}
      {showStats && (
        <div className="space-y-1.5">
          <StatBar label="Charisma" value={charisma} />
          <StatBar label="Strategy" value={strategy} />
          <StatBar label="Loyalty" value={loyalty} />
          <StatBar label="Aggress." value={aggression} />
          <StatBar label="Wit" value={wit} />
        </div>
      )}
    </div>
  );
}
