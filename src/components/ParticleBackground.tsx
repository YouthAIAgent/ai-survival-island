"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number; y: number; vx: number; vy: number;
  size: number; alpha: number; color: string; life: number; maxLife: number;
}

export default function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let particles: Particle[] = [];
    const colors = ["#e84142", "#ff6b6b", "#ffa07a", "#ff4444", "#ff8c00", "#ffd700"];

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    function createParticle(): Particle {
      return {
        x: Math.random() * canvas!.width,
        y: canvas!.height + 10,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -Math.random() * 1.5 - 0.5,
        size: Math.random() * 3 + 1,
        alpha: Math.random() * 0.5 + 0.1,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 0,
        maxLife: Math.random() * 200 + 100,
      };
    }

    // Ember/firefly particles
    for (let i = 0; i < 60; i++) {
      const p = createParticle();
      p.y = Math.random() * canvas.height;
      p.life = Math.random() * p.maxLife;
      particles.push(p);
    }

    function animate() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);

      // Add new particles
      if (particles.length < 80 && Math.random() > 0.9) {
        particles.push(createParticle());
      }

      particles = particles.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        p.vx += (Math.random() - 0.5) * 0.05;

        const lifeRatio = p.life / p.maxLife;
        const currentAlpha = p.alpha * (1 - lifeRatio);

        if (currentAlpha <= 0 || p.life >= p.maxLife) return false;

        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.size * (1 - lifeRatio * 0.5), 0, Math.PI * 2);
        ctx!.fillStyle = p.color;
        ctx!.globalAlpha = currentAlpha;
        ctx!.fill();

        // Glow effect
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
        ctx!.fillStyle = p.color;
        ctx!.globalAlpha = currentAlpha * 0.15;
        ctx!.fill();

        ctx!.globalAlpha = 1;
        return true;
      });

      animationId = requestAnimationFrame(animate);
    }

    animate();
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.6 }}
    />
  );
}
