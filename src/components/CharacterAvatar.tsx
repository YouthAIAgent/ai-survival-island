"use client";

interface CharacterAvatarProps {
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  isAlive?: boolean;
  isSelected?: boolean;
  showRing?: boolean;
}

const CHARACTER_DATA: Record<string, { gradient: string; accent: string; icon: string; silhouette: string }> = {
  Shadow: {
    gradient: "from-purple-600 via-indigo-700 to-purple-900",
    accent: "#8b5cf6",
    icon: "🥷",
    silhouette: "M20 8c0-3-2-5.5-5-6.5S9 2 9 5c0 1 .5 2 1 3l-3 4c-.5.7-.5 1.5 0 2l3 3c1 1 2.5 1 3.5 0l3-3c.5-.5.5-1.5 0-2L14 8c.5-1 1-2 1-3 3 1 5 3 5 3z",
  },
  Blaze: {
    gradient: "from-red-500 via-orange-600 to-red-800",
    accent: "#ef4444",
    icon: "🔥",
    silhouette: "M12 2C8 6 4 10 4 14c0 4.4 3.6 8 8 8s8-3.6 8-8c0-4-4-8-8-12zm0 18c-3.3 0-6-2.7-6-6 0-2.5 2-5 4-7.5 .5-.6 1.3-1.2 2-1.8.7.6 1.5 1.2 2 1.8 2 2.5 4 5 4 7.5 0 3.3-2.7 6-6 6z",
  },
  Luna: {
    gradient: "from-pink-500 via-rose-600 to-pink-900",
    accent: "#ec4899",
    icon: "🌙",
    silhouette: "M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c1 0 2-.2 3-.4C11 20 8 16.5 8 12.5S11 4 15 2.4C14 2.2 13 2 12 2z",
  },
  Tank: {
    gradient: "from-blue-500 via-cyan-600 to-blue-900",
    accent: "#3b82f6",
    icon: "🛡️",
    silhouette: "M12 2L3 7v5c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V7l-9-5zm0 2.2L19 8.5V12c0 4.5-3 8.7-7 9.9-4-1.2-7-5.4-7-9.9V8.5L12 4.2z",
  },
  Viper: {
    gradient: "from-green-500 via-emerald-600 to-green-900",
    accent: "#10b981",
    icon: "🐍",
    silhouette: "M20 8c-2-2-5-3-8-3s-6 1-8 3c-1 1-1 2.5 0 3.5l8 8 8-8c1-1 1-2.5 0-3.5zM12 18l-6-6c-.5-.5-.5-1 0-1.5C8 8.5 10 8 12 8s4 .5 6 2.5c.5.5.5 1 0 1.5l-6 6z",
  },
  Nova: {
    gradient: "from-yellow-400 via-amber-500 to-yellow-700",
    accent: "#f59e0b",
    icon: "✨",
    silhouette: "M12 2l2.5 7.5H22l-6 4.5 2.5 7.5L12 17l-6.5 4.5L8 14 2 9.5h7.5L12 2z",
  },
};

const SIZES = {
  sm: { container: "w-10 h-10", text: "text-lg", ring: 2 },
  md: { container: "w-16 h-16", text: "text-2xl", ring: 3 },
  lg: { container: "w-24 h-24", text: "text-4xl", ring: 4 },
  xl: { container: "w-32 h-32", text: "text-5xl", ring: 5 },
};

export default function CharacterAvatar({ name, size = "md", isAlive = true, isSelected = false, showRing = true }: CharacterAvatarProps) {
  const data = CHARACTER_DATA[name] || CHARACTER_DATA.Shadow;
  const sizeConfig = SIZES[size];

  return (
    <div className="relative inline-flex items-center justify-center">
      {/* Rotating ring */}
      {showRing && isAlive && (
        <div
          className="absolute inset-0 rounded-full animate-spin-slow"
          style={{
            background: `conic-gradient(${data.accent}, transparent, ${data.accent}, transparent, ${data.accent})`,
            padding: sizeConfig.ring,
            filter: isSelected ? `drop-shadow(0 0 10px ${data.accent})` : "none",
          }}
        >
          <div className="w-full h-full rounded-full bg-[#0a0a1a]" />
        </div>
      )}

      {/* Avatar body */}
      <div
        className={`${sizeConfig.container} rounded-full bg-gradient-to-br ${data.gradient} flex items-center justify-center relative overflow-hidden ${
          !isAlive ? "grayscale opacity-40" : ""
        } ${isSelected ? "scale-110" : ""} transition-all duration-300`}
      >
        {/* Inner glow */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

        {/* Character icon */}
        <span className={`${sizeConfig.text} relative z-10 ${isAlive ? "" : "opacity-50"}`}>
          {data.icon}
        </span>

        {/* Pulse effect for alive */}
        {isAlive && (
          <div
            className="absolute inset-0 rounded-full animate-ping opacity-20"
            style={{ backgroundColor: data.accent }}
          />
        )}
      </div>

      {/* Dead X overlay */}
      {!isAlive && (
        <div className="absolute inset-0 flex items-center justify-center">
          <svg className="w-3/4 h-3/4 text-red-500 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <line x1="4" y1="4" x2="20" y2="20" />
            <line x1="20" y1="4" x2="4" y2="20" />
          </svg>
        </div>
      )}
    </div>
  );
}
