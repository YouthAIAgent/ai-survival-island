"use client";

import { useState } from "react";

interface ChatBubbleProps {
  agentName: string;
  gameId: string;
  onWhisper: (message: string) => void;
}

export default function ChatBubble({
  agentName,
  gameId,
  onWhisper,
}: ChatBubbleProps) {
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  function handleSend() {
    if (!message.trim()) return;
    onWhisper(message);
    setSent(true);
    setTimeout(() => setSent(false), 3000);
    setMessage("");
  }

  return (
    <div className="glass-card rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🤫</span>
        <h3 className="text-sm font-bold text-white">
          Whisper to {agentName}
        </h3>
      </div>
      <p className="text-xs text-gray-400 mb-3">
        Send a secret strategic hint to your agent. Only they can see it.
      </p>

      <div className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="e.g., Ally with Luna, betray Shadow..."
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
        />
        <button
          onClick={handleSend}
          disabled={!message.trim()}
          className="avax-gradient px-4 py-2 rounded-lg text-white text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
        >
          Send
        </button>
      </div>

      {sent && (
        <p className="text-xs text-green-400 mt-2 animate-slide-up">
          Whisper sent! Your agent will use this hint next round.
        </p>
      )}
    </div>
  );
}
