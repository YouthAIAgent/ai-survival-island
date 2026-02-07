"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface Agent {
  name: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  color: string;
  emoji: string;
  isAlive: boolean;
  dialogue: string;
  dialogueTimer: number;
  action: string;
  allyWith: string | null;
  speed: number;
  bobOffset: number;
  shadowPulse: number;
  facing: number; // -1 left, 1 right
  walkFrame: number;
}

interface GameCanvasProps {
  aliveAgents: string[];
  eliminatedAgents: string[];
  events: Array<{ agentName: string; content: string; type: string; target?: string }>;
  round: number;
  status: string;
  onReady?: () => void;
}

const AGENT_CONFIG: Record<string, { color: string; emoji: string; bodyColor: string; hairColor: string }> = {
  Shadow: { color: "#8b5cf6", emoji: "🥷", bodyColor: "#4c1d95", hairColor: "#1e1b4b" },
  Blaze:  { color: "#ef4444", emoji: "🔥", bodyColor: "#991b1b", hairColor: "#f97316" },
  Luna:   { color: "#ec4899", emoji: "🌙", bodyColor: "#9d174d", hairColor: "#fbbf24" },
  Tank:   { color: "#3b82f6", emoji: "🛡️", bodyColor: "#1e40af", hairColor: "#374151" },
  Viper:  { color: "#10b981", emoji: "🐍", bodyColor: "#065f46", hairColor: "#064e3b" },
  Nova:   { color: "#f59e0b", emoji: "✨", bodyColor: "#92400e", hairColor: "#fcd34d" },
};

function drawCharacter(ctx: CanvasRenderingContext2D, agent: Agent, time: number) {
  const cfg = AGENT_CONFIG[agent.name] || AGENT_CONFIG.Shadow;
  const { x, y } = agent;
  const bob = Math.sin(time * 3 + agent.bobOffset) * 2;
  const walkBob = agent.speed > 0.1 ? Math.sin(time * 8 + agent.bobOffset) * 3 : 0;

  ctx.save();
  ctx.translate(x, y);

  if (!agent.isAlive) {
    ctx.globalAlpha = 0.25;
  }

  // Shadow on ground
  ctx.beginPath();
  ctx.ellipse(0, 28, 14 + Math.sin(time + agent.shadowPulse) * 2, 5, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.fill();

  // Legs (walking animation)
  const legSwing = agent.speed > 0.1 ? Math.sin(time * 10) * 8 : 0;
  ctx.strokeStyle = cfg.bodyColor;
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  // Left leg
  ctx.beginPath();
  ctx.moveTo(-5, 15 + bob);
  ctx.lineTo(-5 + legSwing, 27);
  ctx.stroke();
  // Right leg
  ctx.beginPath();
  ctx.moveTo(5, 15 + bob);
  ctx.lineTo(5 - legSwing, 27);
  ctx.stroke();

  // Body
  ctx.beginPath();
  ctx.roundRect(-10, -5 + bob + walkBob, 20, 22, 4);
  ctx.fillStyle = cfg.bodyColor;
  ctx.fill();
  ctx.strokeStyle = cfg.color;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Arms
  const armSwing = agent.speed > 0.1 ? Math.sin(time * 10 + Math.PI) * 15 : Math.sin(time * 2) * 3;
  ctx.strokeStyle = cfg.bodyColor;
  ctx.lineWidth = 4;
  // Left arm
  ctx.beginPath();
  ctx.moveTo(-10, 2 + bob);
  ctx.lineTo(-16, 12 + bob + armSwing);
  ctx.stroke();
  // Right arm
  ctx.beginPath();
  ctx.moveTo(10, 2 + bob);
  ctx.lineTo(16, 12 + bob - armSwing);
  ctx.stroke();

  // Head
  ctx.beginPath();
  ctx.arc(0, -12 + bob + walkBob, 12, 0, Math.PI * 2);
  ctx.fillStyle = "#fbbf80";
  ctx.fill();
  ctx.strokeStyle = cfg.color;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Hair
  ctx.beginPath();
  ctx.arc(0, -16 + bob + walkBob, 12, Math.PI, 0);
  ctx.fillStyle = cfg.hairColor;
  ctx.fill();

  // Eyes
  const eyeDir = agent.facing * 2;
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.arc(-4 + eyeDir, -13 + bob + walkBob, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(4 + eyeDir, -13 + bob + walkBob, 2, 0, Math.PI * 2);
  ctx.fill();
  // Eye shine
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(-3 + eyeDir, -14 + bob + walkBob, 0.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(5 + eyeDir, -14 + bob + walkBob, 0.8, 0, Math.PI * 2);
  ctx.fill();

  // Name tag
  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.beginPath();
  ctx.roundRect(-25, -38 + bob, 50, 16, 4);
  ctx.fill();
  ctx.fillStyle = cfg.color;
  ctx.font = "bold 10px Arial";
  ctx.textAlign = "center";
  ctx.fillText(agent.name.toUpperCase(), 0, -26 + bob);

  // Status indicator
  if (agent.isAlive) {
    ctx.beginPath();
    ctx.arc(20, -32 + bob, 3, 0, Math.PI * 2);
    ctx.fillStyle = "#22c55e";
    ctx.fill();
  }

  // Glow ring when active
  if (agent.isAlive && agent.action) {
    ctx.beginPath();
    ctx.arc(0, 5 + bob, 25 + Math.sin(time * 4) * 3, 0, Math.PI * 2);
    ctx.strokeStyle = cfg.color + "40";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  ctx.restore();

  // Speech bubble (drawn after restore so it's not affected by alpha)
  if (agent.dialogueTimer > 0 && agent.dialogue && agent.isAlive) {
    const alpha = Math.min(1, agent.dialogueTimer / 30);
    ctx.save();
    ctx.globalAlpha = alpha;

    const maxWidth = 180;
    ctx.font = "11px Arial";
    const words = agent.dialogue.split(" ");
    const lines: string[] = [];
    let currentLine = "";
    for (const word of words) {
      const testLine = currentLine ? currentLine + " " + word : word;
      if (ctx.measureText(testLine).width > maxWidth - 16) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);
    const displayLines = lines.slice(0, 3);

    const bubbleH = displayLines.length * 15 + 14;
    const bubbleW = maxWidth;
    const bx = x - bubbleW / 2;
    const by = y - 55 - bubbleH + bob;

    // Bubble
    ctx.fillStyle = "rgba(15,15,25,0.92)";
    ctx.strokeStyle = cfg.color + "80";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(bx, by, bubbleW, bubbleH, 8);
    ctx.fill();
    ctx.stroke();

    // Arrow
    ctx.fillStyle = "rgba(15,15,25,0.92)";
    ctx.beginPath();
    ctx.moveTo(x - 6, by + bubbleH);
    ctx.lineTo(x, by + bubbleH + 8);
    ctx.lineTo(x + 6, by + bubbleH);
    ctx.fill();

    // Text
    ctx.fillStyle = "#e5e7eb";
    ctx.textAlign = "left";
    displayLines.forEach((line, i) => {
      ctx.fillText(line, bx + 8, by + 15 + i * 15);
    });

    ctx.restore();
  }
}

function drawIsland(ctx: CanvasRenderingContext2D, w: number, h: number, time: number) {
  // Ocean
  ctx.fillStyle = "#0c1929";
  ctx.fillRect(0, 0, w, h);

  // Animated water waves
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.strokeStyle = `rgba(59, 130, 246, ${0.05 + i * 0.01})`;
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 5) {
      const y = h * 0.1 + i * (h * 0.2) + Math.sin(x * 0.01 + time + i) * 15;
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // Island shape
  ctx.save();
  ctx.beginPath();
  const cx = w / 2, cy = h / 2;
  const rx = w * 0.38, ry = h * 0.35;
  for (let a = 0; a < Math.PI * 2; a += 0.02) {
    const noise = Math.sin(a * 5) * 15 + Math.sin(a * 3 + 1) * 10 + Math.sin(a * 7 + 2) * 8;
    const px = cx + (rx + noise) * Math.cos(a);
    const py = cy + (ry + noise * 0.7) * Math.sin(a);
    a === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath();

  // Beach border
  ctx.strokeStyle = "#d4a76a";
  ctx.lineWidth = 12;
  ctx.stroke();

  // Island ground
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, rx);
  gradient.addColorStop(0, "#2d5a27");
  gradient.addColorStop(0.6, "#1a4314");
  gradient.addColorStop(0.85, "#3a7a32");
  gradient.addColorStop(1, "#c9a55a");
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.clip();

  // Ground texture
  for (let i = 0; i < 60; i++) {
    const gx = (Math.sin(i * 127.1) * 0.5 + 0.5) * w;
    const gy = (Math.sin(i * 311.7) * 0.5 + 0.5) * h;
    ctx.fillStyle = `rgba(0,0,0,${0.05 + Math.random() * 0.05})`;
    ctx.beginPath();
    ctx.arc(gx, gy, 8 + Math.random() * 15, 0, Math.PI * 2);
    ctx.fill();
  }

  // Trees
  const treePositions = [
    [0.2, 0.25], [0.75, 0.2], [0.15, 0.65], [0.82, 0.7], [0.5, 0.15],
    [0.3, 0.78], [0.7, 0.82], [0.88, 0.4], [0.12, 0.42], [0.6, 0.85],
    [0.4, 0.2], [0.55, 0.75], [0.25, 0.5], [0.78, 0.55],
  ];
  for (const [tx, ty] of treePositions) {
    const treeX = tx * w, treeY = ty * h;
    const sway = Math.sin(time * 1.5 + tx * 10) * 2;
    // Trunk
    ctx.fillStyle = "#5c4a32";
    ctx.fillRect(treeX - 2, treeY - 5, 4, 18);
    // Canopy layers
    for (let l = 0; l < 3; l++) {
      ctx.beginPath();
      ctx.arc(treeX + sway * (1 - l * 0.3), treeY - 8 - l * 7, 10 - l * 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${34 + l * 15}, ${120 + l * 20}, ${34 + l * 10}, 0.9)`;
      ctx.fill();
    }
  }

  // Rocks
  const rockPositions = [[0.35, 0.35], [0.65, 0.45], [0.45, 0.6], [0.55, 0.3]];
  for (const [rx2, ry2] of rockPositions) {
    ctx.fillStyle = "#555";
    ctx.beginPath();
    ctx.ellipse(rx2 * w, ry2 * h, 8, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#666";
    ctx.beginPath();
    ctx.ellipse(rx2 * w - 1, ry2 * h - 1, 6, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Campfire in center
  const fireX = cx, fireY = cy + 20;
  ctx.fillStyle = "#5c4a32";
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    ctx.fillRect(fireX + Math.cos(angle) * 8 - 1, fireY + Math.sin(angle) * 5 - 1, 3, 3);
  }
  // Fire glow
  const fireGlow = ctx.createRadialGradient(fireX, fireY, 0, fireX, fireY, 30);
  fireGlow.addColorStop(0, `rgba(255, ${150 + Math.sin(time * 8) * 50}, 0, 0.3)`);
  fireGlow.addColorStop(1, "transparent");
  ctx.fillStyle = fireGlow;
  ctx.beginPath();
  ctx.arc(fireX, fireY, 30, 0, Math.PI * 2);
  ctx.fill();
  // Fire particles
  for (let i = 0; i < 4; i++) {
    const px = fireX + Math.sin(time * 5 + i * 2) * 4;
    const py = fireY - 5 - (time * 30 + i * 10) % 20;
    const size = 2 + Math.sin(time * 8 + i) * 1;
    ctx.fillStyle = `rgba(255, ${200 - i * 30}, 0, ${0.8 - (py - fireY + 25) / 30})`;
    ctx.beginPath();
    ctx.arc(px, py, Math.max(0.5, size), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();

  // Vignette
  const vignette = ctx.createRadialGradient(cx, cy, rx * 0.5, cx, cy, rx * 1.5);
  vignette.addColorStop(0, "transparent");
  vignette.addColorStop(1, "rgba(0,0,0,0.6)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);
}

function drawAllianceLine(ctx: CanvasRenderingContext2D, a1: Agent, a2: Agent, time: number) {
  if (!a1.isAlive || !a2.isAlive) return;
  ctx.save();
  ctx.setLineDash([4, 4]);
  ctx.lineDashOffset = -time * 20;
  ctx.strokeStyle = "rgba(34, 197, 94, 0.3)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(a1.x, a1.y);
  ctx.lineTo(a2.x, a2.y);
  ctx.stroke();
  ctx.restore();
}

export default function GameCanvas({ aliveAgents, eliminatedAgents, events, round, status }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const agentsRef = useRef<Map<string, Agent>>(new Map());
  const animRef = useRef<number>(0);

  const initAgents = useCallback((canvasW: number, canvasH: number) => {
    const names = ["Shadow", "Blaze", "Luna", "Tank", "Viper", "Nova"];
    const cx = canvasW / 2, cy = canvasH / 2;
    const radius = Math.min(canvasW, canvasH) * 0.22;

    names.forEach((name, i) => {
      if (agentsRef.current.has(name)) {
        const existing = agentsRef.current.get(name)!;
        existing.isAlive = aliveAgents.includes(name);
        return;
      }
      const angle = (i / names.length) * Math.PI * 2 - Math.PI / 2;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      const cfg = AGENT_CONFIG[name] || AGENT_CONFIG.Shadow;

      agentsRef.current.set(name, {
        name, x, y, targetX: x, targetY: y,
        color: cfg.color, emoji: cfg.emoji,
        isAlive: aliveAgents.includes(name),
        dialogue: "", dialogueTimer: 0, action: "",
        allyWith: null, speed: 0, bobOffset: i * 1.3,
        shadowPulse: i * 0.8, facing: 1, walkFrame: 0,
      });
    });
  }, [aliveAgents]);

  // Process events to trigger agent movements & dialogues
  useEffect(() => {
    if (events.length === 0) return;
    const recentEvents = events.filter((e) => e.type === "dialogue" || e.type === "conversation" || e.type === "alliance");
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cx = canvas.width / 2, cy = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) * 0.22;

    for (const event of recentEvents.slice(-12)) {
      const agent = agentsRef.current.get(event.agentName);
      if (!agent || !agent.isAlive) continue;

      if (event.type === "dialogue" || event.type === "conversation") {
        agent.dialogue = event.content;
        agent.dialogueTimer = 200;
      }

      if (event.target) {
        const targetAgent = agentsRef.current.get(event.target);
        if (targetAgent && targetAgent.isAlive) {
          // Move towards target
          const midX = (agent.x + targetAgent.x) / 2;
          const midY = (agent.y + targetAgent.y) / 2;
          agent.targetX = midX + (agent.x > midX ? 20 : -20);
          agent.targetY = midY + (agent.y > midY ? 20 : -20);

          if (event.type === "alliance") {
            agent.allyWith = event.target;
          }
        }
      } else {
        // Random movement on island
        const angle = Math.random() * Math.PI * 2;
        const dist = radius * (0.3 + Math.random() * 0.7);
        agent.targetX = cx + Math.cos(angle) * dist;
        agent.targetY = cy + Math.sin(angle) * dist;
      }
    }
  }, [events]);

  // Update alive status
  useEffect(() => {
    agentsRef.current.forEach((agent) => {
      agent.isAlive = aliveAgents.includes(agent.name);
    });
  }, [aliveAgents]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (!container) return;
      canvas.width = container.clientWidth;
      canvas.height = Math.max(450, container.clientWidth * 0.55);
      initAgents(canvas.width, canvas.height);
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    let startTime = Date.now();

    const animate = () => {
      const time = (Date.now() - startTime) / 1000;
      const w = canvas.width, h = canvas.height;

      // Draw island
      drawIsland(ctx, w, h, time);

      // Update & draw agents
      const agents = Array.from(agentsRef.current.values());

      // Sort by Y for depth
      agents.sort((a, b) => a.y - b.y);

      // Draw alliance lines first
      for (const agent of agents) {
        if (agent.allyWith) {
          const ally = agentsRef.current.get(agent.allyWith);
          if (ally) drawAllianceLine(ctx, agent, ally, time);
        }
      }

      // Update positions & draw
      for (const agent of agents) {
        // Move towards target
        const dx = agent.targetX - agent.x;
        const dy = agent.targetY - agent.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 2) {
          const moveSpeed = 0.8;
          agent.x += (dx / dist) * moveSpeed;
          agent.y += (dy / dist) * moveSpeed;
          agent.speed = moveSpeed;
          agent.facing = dx > 0 ? 1 : -1;
        } else {
          agent.speed *= 0.9;
          // Idle: occasionally pick new nearby target
          if (agent.isAlive && Math.random() < 0.003) {
            const cx = w / 2, cy = h / 2;
            const radius = Math.min(w, h) * 0.22;
            const angle = Math.random() * Math.PI * 2;
            const r = radius * (0.3 + Math.random() * 0.7);
            agent.targetX = cx + Math.cos(angle) * r;
            agent.targetY = cy + Math.sin(angle) * r;
          }
        }

        // Decrease dialogue timer
        if (agent.dialogueTimer > 0) agent.dialogueTimer--;

        drawCharacter(ctx, agent, time);
      }

      // Round indicator
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.beginPath();
      ctx.roundRect(w / 2 - 60, 10, 120, 30, 6);
      ctx.fill();
      ctx.strokeStyle = "rgba(232,65,66,0.5)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = "#e5e7eb";
      ctx.font = "bold 12px Arial";
      ctx.textAlign = "center";
      ctx.fillText(`ROUND ${round}`, w / 2, 30);

      // Alive counter
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.beginPath();
      ctx.roundRect(10, 10, 100, 30, 6);
      ctx.fill();
      ctx.fillStyle = "#22c55e";
      ctx.font = "bold 11px Arial";
      ctx.textAlign = "left";
      ctx.fillText(`ALIVE: ${aliveAgents.length}`, 20, 30);

      // Status
      const statusColors: Record<string, string> = { active: "#22c55e", voting: "#ef4444", ended: "#fbbf24", waiting: "#6b7280" };
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.beginPath();
      ctx.roundRect(w - 110, 10, 100, 30, 6);
      ctx.fill();
      ctx.fillStyle = statusColors[status] || "#fff";
      ctx.font = "bold 11px Arial";
      ctx.textAlign = "right";
      ctx.fillText(status.toUpperCase(), w - 20, 30);

      animRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [round, aliveAgents, status, initAgents]);

  return (
    <div className="w-full rounded-xl overflow-hidden border border-red-500/10 relative">
      <canvas ref={canvasRef} className="w-full block cursor-pointer" />
    </div>
  );
}
