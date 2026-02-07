"use client";

import { useState } from "react";

interface Agent {
  name: string;
  personality: string;
}

interface VotingPanelProps {
  agents: Agent[];
  onVote: (agentName: string) => void;
  isVoting: boolean;
  hasVoted: boolean;
  votedFor?: string;
}

export default function VotingPanel({
  agents,
  onVote,
  isVoting,
  hasVoted,
  votedFor,
}: VotingPanelProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  function handleVote() {
    if (!selected) return;
    setConfirming(true);
  }

  function confirmVote() {
    if (!selected) return;
    onVote(selected);
    setConfirming(false);
  }

  if (hasVoted) {
    return (
      <div className="glass-card rounded-xl p-6 text-center">
        <div className="text-4xl mb-3">🗳️</div>
        <h3 className="text-lg font-bold text-white mb-2">Vote Cast!</h3>
        <p className="text-gray-400">
          You voted to eliminate <span className="text-red-400 font-bold">{votedFor}</span>
        </p>
        <p className="text-xs text-gray-500 mt-2">Waiting for others to vote...</p>
      </div>
    );
  }

  if (!isVoting) {
    return (
      <div className="glass-card rounded-xl p-6 text-center">
        <div className="text-4xl mb-3">⏳</div>
        <h3 className="text-lg font-bold text-white mb-2">Not Voting Phase</h3>
        <p className="text-gray-400 text-sm">
          Voting will begin after the round simulation
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-xl p-6">
      <div className="text-center mb-4">
        <div className="text-4xl mb-2">🗳️</div>
        <h3 className="text-lg font-bold text-white">Vote to Eliminate</h3>
        <p className="text-sm text-gray-400">
          Choose which agent should leave the island
        </p>
      </div>

      {/* Agent options */}
      <div className="space-y-2 mb-4">
        {agents.map((agent) => (
          <button
            key={agent.name}
            onClick={() => setSelected(agent.name)}
            className={`w-full text-left p-3 rounded-lg border transition-all ${
              selected === agent.name
                ? "border-red-500 bg-red-900/30"
                : "border-gray-700 bg-gray-800/30 hover:border-gray-500"
            }`}
          >
            <span className="font-medium text-white">{agent.name}</span>
            <span className="text-xs text-gray-400 ml-2">
              ({agent.personality})
            </span>
          </button>
        ))}
      </div>

      {/* Confirmation */}
      {confirming ? (
        <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4 text-center">
          <p className="text-sm text-red-300 mb-3">
            Eliminate <strong>{selected}</strong>? This cannot be undone!
          </p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={confirmVote}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Confirm Elimination
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={handleVote}
          disabled={!selected}
          className="w-full avax-gradient text-white py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
        >
          {selected ? `Vote to Eliminate ${selected}` : "Select an Agent"}
        </button>
      )}
    </div>
  );
}
