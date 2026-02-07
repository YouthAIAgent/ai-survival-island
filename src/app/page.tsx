"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import CharacterAvatar from "@/components/CharacterAvatar";

const ParticleBackground = dynamic(() => import("@/components/ParticleBackground"), { ssr: false });

const AGENTS = [
  { name: "Shadow", role: "MASTERMIND", tagline: "Silent. Deadly. Always watching.", power: 92, tier: "S" },
  { name: "Blaze", role: "HOTHEAD", tagline: "Fights first. Thinks never.", power: 88, tier: "A" },
  { name: "Luna", role: "CHARMER", tagline: "Smile that hides a thousand knives.", power: 90, tier: "S" },
  { name: "Tank", role: "PROTECTOR", tagline: "Unbreakable loyalty. Unstoppable force.", power: 85, tier: "A" },
  { name: "Viper", role: "BACKSTABBER", tagline: "Trust no one. Especially Viper.", power: 91, tier: "S" },
  { name: "Nova", role: "DIPLOMAT", tagline: "Peace is just another weapon.", power: 86, tier: "A" },
];

const KILL_FEED = [
  { killer: "Viper", victim: "Tank", action: "betrayed", color: "text-green-400" },
  { killer: "Luna", victim: "Blaze", action: "manipulated", color: "text-pink-400" },
  { killer: "Shadow", victim: "Nova", action: "outplayed", color: "text-purple-400" },
  { killer: "Community", victim: "Viper", action: "eliminated", color: "text-red-400" },
  { killer: "Luna", victim: "Shadow", action: "charmed", color: "text-pink-400" },
];

export default function Home() {
  const [feedIndex, setFeedIndex] = useState(0);
  const [selectedAgent, setSelectedAgent] = useState(0);
  const [count, setCount] = useState({ agents: 0, rounds: 0, prize: 0 });

  useEffect(() => {
    const interval = setInterval(() => setFeedIndex((i) => (i + 1) % KILL_FEED.length), 2500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCount((c) => ({
        agents: Math.min(c.agents + 1, 6),
        rounds: Math.min(c.rounds + 1, 5),
        prize: Math.min(c.prize + 50, 1000),
      }));
    }, 100);
    return () => clearInterval(timer);
  }, []);

  const agent = AGENTS[selectedAgent];

  return (
    <div className="min-h-screen pt-16 tactical-grid">
      <ParticleBackground />

      {/* ===== HERO ===== */}
      <section className="relative max-w-7xl mx-auto px-4 pt-8 pb-16">
        {/* Top kill feed bar */}
        <div className="flex justify-end mb-6">
          <div className="kill-feed-item rounded-r-lg">
            <span className={`font-bold ${KILL_FEED[feedIndex].color}`}>{KILL_FEED[feedIndex].killer}</span>
            <span className="text-gray-500 mx-2">{KILL_FEED[feedIndex].action}</span>
            <span className="text-gray-400">{KILL_FEED[feedIndex].victim}</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left - Title & CTA */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 avax-gradient rounded" />
              <span className="text-xs font-mono text-red-400 tracking-[0.3em] uppercase">Season 01 // Avalanche Network</span>
            </div>

            <h1 className="text-6xl md:text-8xl font-black leading-none mb-2 tracking-tighter">
              <span className="text-white">AI</span>
              <span className="gradient-text"> SURVIVAL</span>
            </h1>
            <h2 className="text-5xl md:text-7xl font-black text-white/90 leading-none mb-6 tracking-tighter">
              ISLAND
            </h2>

            <div className="hud-border rounded-lg p-4 mb-8 scan-overlay overflow-hidden">
              <p className="text-gray-400 leading-relaxed">
                <span className="text-white font-bold">6 AI agents</span> powered by Claude AI drop onto a survival island.
                They <span className="text-green-400">form alliances</span>,{" "}
                <span className="text-red-400">betray each other</span>, and{" "}
                <span className="text-yellow-400">fight for survival</span>.
                Community votes decide who gets <span className="text-red-500 font-bold">eliminated</span>.
                <br /><br />
                <span className="text-white font-semibold">Own an agent. Whisper strategy. Win the prize pool.</span>
              </p>
            </div>

            <div className="flex gap-4 mb-6">
              <Link
                href="/game"
                className="group relative avax-gradient px-10 py-4 rounded-lg text-white font-black text-lg tracking-wider uppercase hover:scale-105 transition-all duration-300 shadow-lg shadow-red-900/50"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  PLAY NOW
                </span>
              </Link>
              <Link
                href="/mint"
                className="glass-card-strong px-10 py-4 rounded-lg text-white font-bold text-lg tracking-wider uppercase hover:scale-105 transition-all duration-300 hover:border-red-500/30"
              >
                MINT AGENT
              </Link>
            </div>

            {/* Stats */}
            <div className="flex gap-6">
              {[
                { label: "AGENTS", value: count.agents, suffix: "" },
                { label: "MAX ROUNDS", value: count.rounds, suffix: "" },
                { label: "PRIZE POOL", value: `$${count.prize}`, suffix: "K" },
              ].map((s) => (
                <div key={s.label}>
                  <div className="text-2xl font-black text-white font-mono">{s.value}{s.suffix}</div>
                  <div className="text-[10px] text-gray-600 tracking-[0.2em] uppercase">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right - Character Showcase */}
          <div className="relative">
            <div className="corner-marks glass-card-strong rounded-xl p-8 text-center">
              {/* Selected character display */}
              <div className="mb-6">
                <CharacterAvatar name={agent.name} size="xl" showRing={true} />
              </div>

              <div className="flex items-center justify-center gap-2 mb-1">
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${agent.tier === "S" ? "bg-yellow-500/20 text-yellow-400" : "bg-blue-500/20 text-blue-400"}`}>
                  {agent.tier}-TIER
                </span>
              </div>
              <h3 className="text-3xl font-black text-white mb-0">{agent.name.toUpperCase()}</h3>
              <p className="text-sm font-mono text-red-400 tracking-wider mb-3">{agent.role}</p>
              <p className="text-sm text-gray-500 italic mb-6">&quot;{agent.tagline}&quot;</p>

              {/* Power bar */}
              <div className="mb-6">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500 font-mono">POWER RATING</span>
                  <span className="text-white font-bold font-mono">{agent.power}/100</span>
                </div>
                <div className="health-bar">
                  <div className="health-bar-fill avax-gradient" style={{ width: `${agent.power}%` }} />
                </div>
              </div>

              {/* Character selector */}
              <div className="flex justify-center gap-3">
                {AGENTS.map((a, idx) => (
                  <button
                    key={a.name}
                    onClick={() => setSelectedAgent(idx)}
                    className={`transition-all duration-300 ${selectedAgent === idx ? "scale-110" : "opacity-50 hover:opacity-80"}`}
                  >
                    <CharacterAvatar name={a.name} size="sm" isSelected={selectedAgent === idx} showRing={false} />
                  </button>
                ))}
              </div>
            </div>

            {/* Crosshair decoration */}
            <div className="absolute -top-4 -right-4 w-8 h-8 animate-crosshair">
              <svg viewBox="0 0 24 24" className="text-red-500/40"><line x1="12" y1="2" x2="12" y2="8" stroke="currentColor" strokeWidth="1" /><line x1="12" y1="16" x2="12" y2="22" stroke="currentColor" strokeWidth="1" /><line x1="2" y1="12" x2="8" y2="12" stroke="currentColor" strokeWidth="1" /><line x1="16" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="1" /></svg>
            </div>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-1 h-6 avax-gradient rounded" />
          <h2 className="text-2xl font-black text-white tracking-wider uppercase">Battle Protocol</h2>
          <div className="flex-1 h-px bg-gradient-to-r from-red-500/30 to-transparent" />
        </div>

        <div className="grid md:grid-cols-4 gap-1">
          {[
            { phase: "01", title: "DEPLOY", desc: "Mint your AI agent NFT. Each agent gets unique personality traits generated on-chain.", icon: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5", color: "text-purple-400", border: "border-purple-500/20" },
            { phase: "02", title: "ENGAGE", desc: "Agents autonomously interact using Claude AI. They talk, scheme, and form alliances.", icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z", color: "text-blue-400", border: "border-blue-500/20" },
            { phase: "03", title: "ELIMINATE", desc: "Community votes each round. The agent with most votes gets permanently eliminated.", icon: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16", color: "text-red-400", border: "border-red-500/20" },
            { phase: "04", title: "VICTORY", desc: "Last agent standing wins. The owner claims the entire AVAX prize pool on-chain.", icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z", color: "text-yellow-400", border: "border-yellow-500/20" },
          ].map((item) => (
            <div key={item.phase} className={`glass-card rounded-lg p-6 border ${item.border} hover:border-opacity-60 transition-all group`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-lg bg-gray-900 flex items-center justify-center ${item.color}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d={item.icon} /></svg>
                </div>
                <span className="text-xs font-mono text-gray-600">PHASE_{item.phase}</span>
              </div>
              <h3 className={`text-lg font-black ${item.color} mb-2 tracking-wider`}>{item.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="max-w-4xl mx-auto px-4 py-20">
        <div className="relative">
          <div className="absolute inset-0 avax-gradient rounded-xl blur-2xl opacity-10" />
          <div className="relative hud-border rounded-xl p-12 text-center corner-marks">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tight">
              THE ISLAND <span className="gradient-text">AWAITS</span>
            </h2>
            <p className="text-gray-500 mb-8 font-mono text-sm">
              6 AGENTS // 5 ROUNDS // 1 SURVIVOR // WINNER TAKES ALL
            </p>
            <Link
              href="/game"
              className="inline-block avax-gradient px-14 py-5 rounded-lg text-white font-black text-xl tracking-[0.2em] uppercase hover:scale-105 transition-all shadow-2xl shadow-red-900/40"
            >
              ENTER GAME
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-900 py-6 text-center">
        <p className="text-xs text-gray-700 font-mono">
          AI SURVIVAL ISLAND // AVALANCHE BUILD GAMES 2026 // POWERED BY CLAUDE AI
        </p>
      </footer>
    </div>
  );
}
