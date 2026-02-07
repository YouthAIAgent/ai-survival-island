"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html, Sky } from "@react-three/drei";
import * as THREE from "three";
import { AGENT_POSITIONS } from "@/lib/gamePositions";
import type { AgentGameState, TimeOfDay } from "@/types/gameTypes";

// ============= TYPES =============
interface AgentData {
  name: string;
  isAlive: boolean;
}

export interface Island3DProps {
  agents: AgentData[];
  events?: { type: string; agentName: string; content: string }[];
  round: number;
  status: string;
  timeOfDay?: TimeOfDay;
  agentStates?: Record<string, AgentGameState>;
}

// ============= CONSTANTS =============
const AGENT_COLORS: Record<string, string> = {
  Shadow: "#8b5cf6",
  Blaze: "#ef4444",
  Luna: "#ec4899",
  Tank: "#3b82f6",
  Viper: "#22c55e",
  Nova: "#eab308",
};

const ISLAND_RADIUS = 12;
const GROUND_Y = 1.0;

// ============= ANIMATED WATER =============
function AnimatedWater({ isNight }: { isNight: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const positions = meshRef.current.geometry.attributes.position;
    const time = clock.getElapsedTime();
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const wave =
        Math.sin(x * 0.12 + time * 0.8) * 0.2 +
        Math.cos(y * 0.12 + time * 0.5) * 0.15;
      positions.setZ(i, wave);
    }
    positions.needsUpdate = true;
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
      <planeGeometry args={[200, 200, 40, 40]} />
      <meshStandardMaterial
        color={isNight ? "#0a2a5a" : "#0369a1"}
        transparent
        opacity={0.9}
        roughness={0.15}
        metalness={0.5}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// ============= ISLAND TERRAIN =============
function IslandTerrain() {
  return (
    <group>
      <mesh position={[0, 0.5, 0]} receiveShadow>
        <cylinderGeometry args={[ISLAND_RADIUS, ISLAND_RADIUS + 1, 1, 32]} />
        <meshStandardMaterial color="#2d5a1e" roughness={0.9} flatShading />
      </mesh>
      <mesh position={[0, 0.15, 0]} receiveShadow>
        <cylinderGeometry args={[ISLAND_RADIUS + 1, ISLAND_RADIUS + 3.5, 0.5, 32]} />
        <meshStandardMaterial color="#d4a843" roughness={1} flatShading />
      </mesh>
      <mesh position={[0, -0.3, 0]}>
        <cylinderGeometry args={[ISLAND_RADIUS + 3.5, ISLAND_RADIUS + 5, 0.6, 32]} />
        <meshStandardMaterial color="#8B7D3C" roughness={1} flatShading />
      </mesh>
      <mesh position={[0, 1.15, 0]} receiveShadow>
        <coneGeometry args={[4, 0.8, 12]} />
        <meshStandardMaterial color="#1a5a0f" roughness={0.95} flatShading />
      </mesh>
      <mesh position={[5, 1.05, -3]} receiveShadow>
        <coneGeometry args={[2.5, 0.5, 8]} />
        <meshStandardMaterial color="#256b1a" roughness={0.95} flatShading />
      </mesh>
      <mesh position={[-4, 1.05, 4]} receiveShadow>
        <coneGeometry args={[2, 0.4, 8]} />
        <meshStandardMaterial color="#256b1a" roughness={0.95} flatShading />
      </mesh>
    </group>
  );
}

// ============= PALM TREE =============
function PalmTree({ position }: { position: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.z =
        Math.sin(clock.getElapsedTime() * 0.5 + position[0]) * 0.02;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <mesh position={[0, 1.8, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.22, 3.5, 8]} />
        <meshStandardMaterial color="#8B6914" roughness={0.9} />
      </mesh>
      {[0.5, 1.2, 1.9, 2.6].map((h) => (
        <mesh key={h} position={[0, h, 0]}>
          <torusGeometry args={[0.18, 0.025, 4, 8]} />
          <meshStandardMaterial color="#7a5c12" />
        </mesh>
      ))}
      {[0, 72, 144, 216, 288].map((angle) => {
        const rad = (angle * Math.PI) / 180;
        return (
          <mesh
            key={angle}
            position={[Math.cos(rad) * 0.8, 3.6, Math.sin(rad) * 0.8]}
            rotation={[Math.cos(rad) * 0.6, rad, Math.sin(rad) * 0.3]}
            castShadow
          >
            <coneGeometry args={[0.6, 2.2, 4]} />
            <meshStandardMaterial color="#228B22" roughness={0.8} side={THREE.DoubleSide} flatShading />
          </mesh>
        );
      })}
      {[30, 150, 270].map((angle) => {
        const rad = (angle * Math.PI) / 180;
        return (
          <mesh key={`c-${angle}`} position={[Math.cos(rad) * 0.25, 3.3, Math.sin(rad) * 0.25]}>
            <sphereGeometry args={[0.08, 6, 6]} />
            <meshStandardMaterial color="#654321" />
          </mesh>
        );
      })}
    </group>
  );
}

// ============= ROCK =============
function Rock({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const rotation = useMemo(
    () => [Math.random() * 0.5, Math.random() * Math.PI, 0] as [number, number, number],
    []
  );
  return (
    <mesh position={position} scale={scale} rotation={rotation} castShadow receiveShadow>
      <dodecahedronGeometry args={[0.5, 0]} />
      <meshStandardMaterial color="#5a5a5a" roughness={0.95} flatShading />
    </mesh>
  );
}

// ============= BUSH =============
function Bush({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <sphereGeometry args={[0.45, 6, 5]} />
        <meshStandardMaterial color="#1a6b1a" roughness={0.9} flatShading />
      </mesh>
      <mesh position={[0.3, -0.05, 0.15]} castShadow>
        <sphereGeometry args={[0.3, 6, 5]} />
        <meshStandardMaterial color="#228B22" roughness={0.9} flatShading />
      </mesh>
      <mesh position={[-0.2, -0.05, -0.2]} castShadow>
        <sphereGeometry args={[0.25, 6, 5]} />
        <meshStandardMaterial color="#1d7a1d" roughness={0.9} flatShading />
      </mesh>
    </group>
  );
}

// ============= CAMPFIRE =============
function Campfire() {
  const lightRef = useRef<THREE.PointLight>(null);
  const flame1Ref = useRef<THREE.Mesh>(null);
  const flame2Ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (lightRef.current) {
      lightRef.current.intensity = 3 + Math.sin(t * 5) * 1 + Math.sin(t * 7) * 0.5;
    }
    if (flame1Ref.current) {
      flame1Ref.current.scale.y = 1 + Math.sin(t * 4) * 0.25;
      flame1Ref.current.scale.x = 1 + Math.sin(t * 3) * 0.1;
      flame1Ref.current.rotation.y = t * 2;
    }
    if (flame2Ref.current) {
      flame2Ref.current.scale.y = 0.8 + Math.cos(t * 5) * 0.2;
      flame2Ref.current.rotation.y = -t * 1.5;
    }
  });

  return (
    <group position={[0, GROUND_Y, 0]}>
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
        const rad = (angle * Math.PI) / 180;
        return (
          <mesh key={angle} position={[Math.cos(rad) * 0.6, 0.05, Math.sin(rad) * 0.6]}>
            <sphereGeometry args={[0.12, 5, 5]} />
            <meshStandardMaterial color="#666" roughness={1} flatShading />
          </mesh>
        );
      })}
      {[0, 60, 120].map((angle) => {
        const rad = (angle * Math.PI) / 180;
        return (
          <mesh key={angle} position={[Math.cos(rad) * 0.25, 0.12, Math.sin(rad) * 0.25]} rotation={[0, rad, Math.PI / 8]}>
            <cylinderGeometry args={[0.05, 0.07, 0.7, 6]} />
            <meshStandardMaterial color="#4a2f1b" roughness={0.9} />
          </mesh>
        );
      })}
      <mesh ref={flame1Ref} position={[0, 0.4, 0]}>
        <coneGeometry args={[0.18, 0.6, 8]} />
        <meshStandardMaterial color="#ff4500" emissive="#ff4500" emissiveIntensity={2} transparent opacity={0.9} />
      </mesh>
      <mesh ref={flame2Ref} position={[0.05, 0.35, 0.05]}>
        <coneGeometry args={[0.12, 0.5, 6]} />
        <meshStandardMaterial color="#ff8c00" emissive="#ff8c00" emissiveIntensity={1.5} transparent opacity={0.7} />
      </mesh>
      <mesh position={[-0.03, 0.25, -0.03]}>
        <coneGeometry args={[0.08, 0.35, 5]} />
        <meshStandardMaterial color="#ffcc00" emissive="#ffcc00" emissiveIntensity={1} transparent opacity={0.5} />
      </mesh>
      <pointLight ref={lightRef} color="#ff6b00" intensity={3} distance={12} position={[0, 0.6, 0]} castShadow />
    </group>
  );
}

// ============= TORCH =============
function Torch({ position }: { position: [number, number, number] }) {
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    if (lightRef.current) {
      lightRef.current.intensity = 1 + Math.sin(clock.getElapsedTime() * 3 + position[0]) * 0.4;
    }
  });

  return (
    <group position={position}>
      <mesh castShadow>
        <cylinderGeometry args={[0.04, 0.06, 2.2, 6]} />
        <meshStandardMaterial color="#4a2f1b" />
      </mesh>
      <mesh position={[0, 1.2, 0]}>
        <coneGeometry args={[0.06, 0.2, 6]} />
        <meshStandardMaterial color="#ff4500" emissive="#ff4500" emissiveIntensity={3} />
      </mesh>
      <pointLight ref={lightRef} color="#ff8c00" intensity={1} distance={6} position={[0, 1.3, 0]} />
    </group>
  );
}

// ============= DOCK =============
function Dock() {
  return (
    <group position={[ISLAND_RADIUS + 1.5, 0.3, 0]} rotation={[0, 0.3, 0]}>
      <mesh receiveShadow>
        <boxGeometry args={[4, 0.12, 1.4]} />
        <meshStandardMaterial color="#6b4226" roughness={0.95} />
      </mesh>
      {[-1.5, 0, 1.5].map((x) => (
        <group key={x}>
          <mesh position={[x, 0.5, 0.65]}>
            <cylinderGeometry args={[0.04, 0.04, 0.9, 6]} />
            <meshStandardMaterial color="#5a3a20" />
          </mesh>
          <mesh position={[x, 0.5, -0.65]}>
            <cylinderGeometry args={[0.04, 0.04, 0.9, 6]} />
            <meshStandardMaterial color="#5a3a20" />
          </mesh>
        </group>
      ))}
      {[-1.5, 1.5].map((x) => (
        <group key={`s-${x}`}>
          <mesh position={[x, -0.35, 0.5]}>
            <cylinderGeometry args={[0.06, 0.06, 0.9, 6]} />
            <meshStandardMaterial color="#4a2f1b" />
          </mesh>
          <mesh position={[x, -0.35, -0.5]}>
            <cylinderGeometry args={[0.06, 0.06, 0.9, 6]} />
            <meshStandardMaterial color="#4a2f1b" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ============= DISTANT MOUNTAINS =============
function Mountains() {
  const mountains = useMemo(
    () => [
      { pos: [40, -2, -50] as [number, number, number], r: 8, h: 12 },
      { pos: [60, -2, -40] as [number, number, number], r: 10, h: 15 },
      { pos: [50, -2, -60] as [number, number, number], r: 12, h: 10 },
      { pos: [-50, -2, -40] as [number, number, number], r: 9, h: 13 },
      { pos: [-60, -2, -55] as [number, number, number], r: 11, h: 11 },
      { pos: [-30, -2, -60] as [number, number, number], r: 7, h: 8 },
      { pos: [10, -2, -65] as [number, number, number], r: 10, h: 14 },
    ],
    []
  );

  return (
    <group>
      {mountains.map((mt, i) => (
        <mesh key={i} position={mt.pos}>
          <coneGeometry args={[mt.r, mt.h, 6]} />
          <meshStandardMaterial color="#1a1a3e" roughness={1} flatShading />
        </mesh>
      ))}
    </group>
  );
}

// ============= FIREFLIES =============
function Fireflies({ isNight }: { isNight: boolean }) {
  const count = isNight ? 45 : 25;
  const groupRef = useRef<THREE.Group>(null);

  const initialData = useMemo(
    () =>
      Array.from({ length: count }, () => {
        const angle = Math.random() * Math.PI * 2;
        const radius = 1 + Math.random() * (ISLAND_RADIUS - 2);
        return {
          x: Math.cos(angle) * radius,
          y: GROUND_Y + 0.8 + Math.random() * 3,
          z: Math.sin(angle) * radius,
          speed: 0.2 + Math.random() * 0.4,
          phase: Math.random() * Math.PI * 2,
        };
      }),
    [count]
  );

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.children.forEach((child, i) => {
      if (i >= initialData.length) return;
      const d = initialData[i];
      child.position.x = d.x + Math.sin(t * d.speed + d.phase) * 1.5;
      child.position.y = d.y + Math.sin(t * d.speed * 1.5 + d.phase) * 0.8;
      child.position.z = d.z + Math.cos(t * d.speed + d.phase) * 1.5;
      child.visible = Math.sin(t * 3 + i * 1.7) > -0.3;
    });
  });

  return (
    <group ref={groupRef}>
      {initialData.map((d, i) => (
        <mesh key={i} position={[d.x, d.y, d.z]}>
          <sphereGeometry args={[isNight ? 0.06 : 0.04, 4, 4]} />
          <meshStandardMaterial
            color={isNight ? "#88ff88" : "#ffff44"}
            emissive={isNight ? "#88ff88" : "#ffff44"}
            emissiveIntensity={isNight ? 3 : 2}
            transparent
            opacity={0.9}
          />
        </mesh>
      ))}
    </group>
  );
}

// ============= SEAGULLS =============
function Seagull({ radius, speed, height, phase }: { radius: number; speed: number; height: number; phase: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const leftWingRef = useRef<THREE.Mesh>(null);
  const rightWingRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * speed + phase;
    if (groupRef.current) {
      groupRef.current.position.x = Math.cos(t) * radius;
      groupRef.current.position.z = Math.sin(t) * radius;
      groupRef.current.position.y = height + Math.sin(t * 2) * 0.5;
      groupRef.current.rotation.y = -t + Math.PI / 2;
    }
    const flap = Math.sin(clock.getElapsedTime() * 6 + phase) * 0.4;
    if (leftWingRef.current) leftWingRef.current.rotation.z = 0.2 + flap;
    if (rightWingRef.current) rightWingRef.current.rotation.z = -0.2 - flap;
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <capsuleGeometry args={[0.04, 0.12, 4, 4]} />
        <meshStandardMaterial color="#f0f0f0" />
      </mesh>
      <mesh ref={leftWingRef} position={[0.18, 0, 0]}>
        <planeGeometry args={[0.3, 0.06]} />
        <meshStandardMaterial color="#e8e8e8" side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={rightWingRef} position={[-0.18, 0, 0]}>
        <planeGeometry args={[0.3, 0.06]} />
        <meshStandardMaterial color="#e8e8e8" side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// ============= LOOT CRATE =============
function LootCrate({ position, color }: { position: [number, number, number]; color: string }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = clock.getElapsedTime() * 0.8;
      meshRef.current.position.y = position[1] + Math.sin(clock.getElapsedTime() * 2) * 0.15;
    }
  });

  return (
    <group position={position}>
      <mesh ref={meshRef} castShadow>
        <boxGeometry args={[0.4, 0.4, 0.4]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} roughness={0.3} metalness={0.6} />
      </mesh>
      <pointLight color={color} intensity={0.6} distance={4} position={[0, 0.5, 0]} />
    </group>
  );
}

// ============= SHIPWRECK =============
function Shipwreck() {
  return (
    <group position={[-ISLAND_RADIUS - 3, -0.4, -5]} rotation={[0, 0.5, 0.12]}>
      <mesh castShadow>
        <boxGeometry args={[3, 0.8, 1.3]} />
        <meshStandardMaterial color="#5a3a20" roughness={0.95} />
      </mesh>
      <mesh position={[-0.8, 0.3, 0]}>
        <boxGeometry args={[0.8, 0.4, 1.1]} />
        <meshStandardMaterial color="#4a2f1b" roughness={0.95} />
      </mesh>
      <mesh position={[0.5, 0.8, 0]} rotation={[0, 0, 0.3]}>
        <cylinderGeometry args={[0.05, 0.04, 2, 6]} />
        <meshStandardMaterial color="#3a2515" />
      </mesh>
      <mesh position={[0.5, 1.5, 0]} rotation={[0, 0, 0.3]}>
        <planeGeometry args={[0.8, 0.5]} />
        <meshStandardMaterial color="#8b7355" side={THREE.DoubleSide} transparent opacity={0.6} />
      </mesh>
    </group>
  );
}

// ============= CAMPFIRE SMOKE =============
function CampfireSmoke() {
  const count = 8;
  const groupRef = useRef<THREE.Group>(null);
  const phases = useMemo(
    () => Array.from({ length: count }, (_, i) => (i * Math.PI * 2) / count),
    []
  );

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.children.forEach((child, i) => {
      const progress = ((t * 0.25 + phases[i] / (Math.PI * 2)) % 1);
      child.position.y = progress * 5;
      child.position.x = Math.sin(t * 0.5 + phases[i]) * progress * 0.6;
      child.position.z = Math.cos(t * 0.5 + phases[i]) * progress * 0.6;
      const scale = 0.05 + progress * 0.4;
      child.scale.set(scale, scale, scale);
      const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
      mat.opacity = (1 - progress) * 0.2;
    });
  });

  return (
    <group ref={groupRef} position={[0, GROUND_Y + 0.8, 0]}>
      {phases.map((_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[1, 6, 6]} />
          <meshStandardMaterial color="#777" transparent opacity={0.15} />
        </mesh>
      ))}
    </group>
  );
}

// ============= FLAG =============
function IslandFlag() {
  const flagRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (flagRef.current) {
      flagRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 2) * 0.1;
    }
  });

  return (
    <group position={[0, GROUND_Y + 1.5, 0]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.03, 0.03, 3, 6]} />
        <meshStandardMaterial color="#666" metalness={0.8} />
      </mesh>
      <mesh ref={flagRef} position={[0.3, 1.2, 0]} castShadow>
        <planeGeometry args={[0.6, 0.4]} />
        <meshStandardMaterial color="#e84142" emissive="#e84142" emissiveIntensity={0.3} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// ============= MOON (Night) =============
function Moon() {
  return (
    <group position={[-30, 25, -20]}>
      <mesh>
        <sphereGeometry args={[3, 16, 16]} />
        <meshStandardMaterial color="#e8e8d0" emissive="#e8e8d0" emissiveIntensity={0.8} />
      </mesh>
      <pointLight color="#aabbff" intensity={0.5} distance={100} />
    </group>
  );
}

// ============= BUFF GLOW EFFECT =============
function BuffGlow({ color, type }: { color: string; type: "shield" | "poison" | "stealth" | "allied" }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    if (type === "shield") {
      meshRef.current.rotation.y = t * 0.5;
      const scale = 1 + Math.sin(t * 2) * 0.05;
      meshRef.current.scale.set(scale, scale, scale);
    } else if (type === "poison") {
      meshRef.current.rotation.y = t * 0.3;
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      mat.opacity = 0.15 + Math.sin(t * 3) * 0.1;
    }
  });

  if (type === "stealth") {
    return null; // Stealth makes character semi-transparent (handled elsewhere)
  }

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.6, 12, 12]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.3}
        transparent
        opacity={0.15}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// ============= AGENT CHARACTER (Enhanced) =============
function AgentCharacter({
  name,
  color,
  isAlive,
  startAngle,
  showSpeech,
  agentState,
}: {
  name: string;
  color: string;
  isAlive: boolean;
  startAngle: number;
  showSpeech?: string;
  agentState?: AgentGameState;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const startRadius = 3 + ((name.charCodeAt(0) * 7) % 5);
  const posRef = useRef(
    new THREE.Vector3(
      Math.cos(startAngle) * startRadius,
      GROUND_Y + 0.65,
      Math.sin(startAngle) * startRadius
    )
  );
  const targetRef = useRef(
    new THREE.Vector3(
      (Math.random() - 0.5) * (ISLAND_RADIUS - 4) * 2,
      GROUND_Y + 0.65,
      (Math.random() - 0.5) * (ISLAND_RADIUS - 4) * 2
    )
  );
  const walkPhaseRef = useRef(Math.random() * Math.PI * 2);
  const speedRef = useRef(0.015 + ((name.charCodeAt(0) * 3) % 10) * 0.001);
  const waitRef = useRef(0);
  const isWaitingRef = useRef(false);

  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);

  const darkerColor = useMemo(() => {
    const c = new THREE.Color(color);
    c.multiplyScalar(0.7);
    return "#" + c.getHexString();
  }, [color]);

  const isStealthed = agentState?.statusEffects?.some((se) => se.id === "stealth") ?? false;
  const hasShield = agentState?.statusEffects?.some((se) => se.name === "Allied" || se.id === "allied") ?? false;
  const isPoisoned = agentState?.statusEffects?.some((se) => se.id === "poison") ?? false;

  useFrame(({ clock }, delta) => {
    if (!groupRef.current) return;

    if (!isAlive) {
      groupRef.current.rotation.z = Math.PI / 2;
      groupRef.current.position.y = GROUND_Y + 0.2;
      return;
    }

    const pos = posRef.current;
    const target = targetRef.current;

    if (isWaitingRef.current) {
      waitRef.current -= delta;
      const breathe = Math.sin(clock.getElapsedTime() * 2) * 0.02;
      groupRef.current.position.set(pos.x, pos.y + breathe, pos.z);
      AGENT_POSITIONS[name] = { x: pos.x, z: pos.z };

      if (leftArmRef.current) leftArmRef.current.rotation.x *= 0.92;
      if (rightArmRef.current) rightArmRef.current.rotation.x *= 0.92;
      if (leftLegRef.current) leftLegRef.current.rotation.x *= 0.92;
      if (rightLegRef.current) rightLegRef.current.rotation.x *= 0.92;

      if (waitRef.current <= 0) {
        isWaitingRef.current = false;
        const angle = Math.random() * Math.PI * 2;
        const radius = 1 + Math.random() * (ISLAND_RADIUS - 5);
        target.set(Math.cos(angle) * radius, pos.y, Math.sin(angle) * radius);
      }
      return;
    }

    const dx = target.x - pos.x;
    const dz = target.z - pos.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < 0.5) {
      isWaitingRef.current = true;
      waitRef.current = 1.5 + Math.random() * 3;
    } else {
      const speed = speedRef.current;
      pos.x += (dx / dist) * speed;
      pos.z += (dz / dist) * speed;

      AGENT_POSITIONS[name] = { x: pos.x, z: pos.z };
      groupRef.current.rotation.y = Math.atan2(dx, dz);

      walkPhaseRef.current += 0.12;
      const bobY = Math.abs(Math.sin(walkPhaseRef.current)) * 0.06;
      groupRef.current.position.set(pos.x, pos.y + bobY, pos.z);

      const swing = Math.sin(walkPhaseRef.current);
      if (leftArmRef.current) leftArmRef.current.rotation.x = swing * 0.6;
      if (rightArmRef.current) rightArmRef.current.rotation.x = -swing * 0.6;
      if (leftLegRef.current) leftLegRef.current.rotation.x = -swing * 0.5;
      if (rightLegRef.current) rightLegRef.current.rotation.x = swing * 0.5;
    }
  });

  const bodyOpacity = isStealthed ? 0.3 : 1;

  return (
    <group ref={groupRef} position={[posRef.current.x, posRef.current.y, posRef.current.z]}>
      {/* Buff glow effects */}
      {hasShield && <BuffGlow color="#22c55e" type="allied" />}
      {isPoisoned && <BuffGlow color="#8b5cf6" type="poison" />}

      {/* Body */}
      <mesh castShadow>
        <capsuleGeometry args={[0.2, 0.35, 4, 8]} />
        <meshStandardMaterial color={color} roughness={0.6} transparent opacity={bodyOpacity} />
      </mesh>

      {/* Head */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <sphereGeometry args={[0.22, 12, 12]} />
        <meshStandardMaterial color={color} roughness={0.5} transparent opacity={bodyOpacity} />
      </mesh>

      {/* Eyes */}
      <mesh position={[0.09, 0.54, 0.18]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="white" transparent opacity={bodyOpacity} />
      </mesh>
      <mesh position={[-0.09, 0.54, 0.18]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="white" transparent opacity={bodyOpacity} />
      </mesh>
      <mesh position={[0.09, 0.54, 0.22]}>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshStandardMaterial color="#111" transparent opacity={bodyOpacity} />
      </mesh>
      <mesh position={[-0.09, 0.54, 0.22]}>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshStandardMaterial color="#111" transparent opacity={bodyOpacity} />
      </mesh>

      {/* Left Arm */}
      <group ref={leftArmRef} position={[0.3, 0.1, 0]}>
        <mesh castShadow>
          <capsuleGeometry args={[0.06, 0.28, 4, 8]} />
          <meshStandardMaterial color={darkerColor} roughness={0.6} transparent opacity={bodyOpacity} />
        </mesh>
      </group>

      {/* Right Arm */}
      <group ref={rightArmRef} position={[-0.3, 0.1, 0]}>
        <mesh castShadow>
          <capsuleGeometry args={[0.06, 0.28, 4, 8]} />
          <meshStandardMaterial color={darkerColor} roughness={0.6} transparent opacity={bodyOpacity} />
        </mesh>
      </group>

      {/* Left Leg */}
      <group ref={leftLegRef} position={[0.1, -0.42, 0]}>
        <mesh castShadow>
          <capsuleGeometry args={[0.07, 0.25, 4, 8]} />
          <meshStandardMaterial color={darkerColor} roughness={0.6} transparent opacity={bodyOpacity} />
        </mesh>
      </group>

      {/* Right Leg */}
      <group ref={rightLegRef} position={[-0.1, -0.42, 0]}>
        <mesh castShadow>
          <capsuleGeometry args={[0.07, 0.25, 4, 8]} />
          <meshStandardMaterial color={darkerColor} roughness={0.6} transparent opacity={bodyOpacity} />
        </mesh>
      </group>

      {/* HP/Mana bars + Level badge + Buff icons (HTML overlay) */}
      {isAlive && agentState && (
        <Html position={[0, 1.0, 0]} center distanceFactor={15}>
          <div className="flex flex-col items-center gap-0.5 pointer-events-none" style={{ minWidth: 60 }}>
            {/* Buff/debuff icons */}
            {agentState.statusEffects.length > 0 && (
              <div className="flex gap-0.5 mb-0.5">
                {agentState.statusEffects.map((se, i) => (
                  <span
                    key={i}
                    className="text-[8px] bg-black/60 rounded px-0.5"
                    style={{ filter: se.type === "debuff" ? "hue-rotate(180deg)" : "none" }}
                  >
                    {se.icon}
                  </span>
                ))}
              </div>
            )}

            {/* Name + Level */}
            <div className="flex items-center gap-1">
              <div
                className="px-1.5 py-0 rounded-full text-[9px] font-black text-white whitespace-nowrap"
                style={{
                  backgroundColor: `${color}cc`,
                  border: `1.5px solid ${color}`,
                  textShadow: "0 1px 3px rgba(0,0,0,0.9)",
                }}
              >
                {name}
              </div>
              <div
                className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] font-black text-white"
                style={{ backgroundColor: color }}
              >
                {agentState.level}
              </div>
            </div>

            {/* HP Bar */}
            <div className="w-14 h-[3px] bg-gray-800/80 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(agentState.hp / agentState.maxHp) * 100}%`,
                  backgroundColor:
                    agentState.hp / agentState.maxHp > 0.6 ? "#22c55e" :
                    agentState.hp / agentState.maxHp > 0.3 ? "#eab308" : "#ef4444",
                  transition: "width 0.5s ease",
                }}
              />
            </div>

            {/* Mana Bar */}
            <div className="w-14 h-[2px] bg-gray-800/80 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-500"
                style={{
                  width: `${(agentState.mana / agentState.maxMana) * 100}%`,
                  transition: "width 0.5s ease",
                }}
              />
            </div>
          </div>
        </Html>
      )}

      {/* Fallback name label (when no agentState) */}
      {isAlive && !agentState && (
        <Html position={[0, 1, 0]} center distanceFactor={15}>
          <div
            className="px-2 py-0.5 rounded-full text-[11px] font-black text-white whitespace-nowrap shadow-lg"
            style={{
              backgroundColor: `${color}cc`,
              border: `2px solid ${color}`,
              textShadow: "0 1px 3px rgba(0,0,0,0.9)",
            }}
          >
            {name}
          </div>
        </Html>
      )}

      {/* Dead label */}
      {!isAlive && (
        <Html position={[0, 1, 0]} center distanceFactor={15}>
          <div
            className="px-2 py-0.5 rounded-full text-[11px] font-black text-white whitespace-nowrap shadow-lg opacity-50"
            style={{
              backgroundColor: `${color}66`,
              border: `2px solid ${color}44`,
              textShadow: "0 1px 3px rgba(0,0,0,0.9)",
            }}
          >
            {name} {"\u2620\uFE0F"}
          </div>
        </Html>
      )}

      {/* Speech bubble */}
      {showSpeech && isAlive && (
        <Html position={[0, 1.7, 0]} center distanceFactor={12}>
          <div className="relative bg-white text-black text-[10px] px-3 py-1.5 rounded-xl max-w-[150px] text-center shadow-xl border border-gray-200">
            <div className="font-medium leading-tight">{showSpeech}</div>
          </div>
        </Html>
      )}
    </group>
  );
}

// ============= SCENE =============
function Scene({ agents, events, timeOfDay, agentStates }: Island3DProps) {
  const isNight = timeOfDay === "night";

  const treePositions = useMemo(() => {
    const positions: [number, number, number][] = [];
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2;
      const radius = ISLAND_RADIUS - 2.5 + (i % 2) * 1.5;
      positions.push([Math.cos(angle) * radius, GROUND_Y, Math.sin(angle) * radius]);
    }
    [0.7, 2.3, 4.1, 5.5].forEach((angle) => {
      const radius = 3 + (angle * 1.3) % 3;
      positions.push([Math.cos(angle) * radius, GROUND_Y, Math.sin(angle) * radius]);
    });
    return positions;
  }, []);

  const rockPositions = useMemo(
    () => [
      { pos: [6, GROUND_Y + 0.1, 2] as [number, number, number], scale: 0.5 },
      { pos: [-5, GROUND_Y + 0.1, -4] as [number, number, number], scale: 0.7 },
      { pos: [3, GROUND_Y + 0.05, -6] as [number, number, number], scale: 0.4 },
      { pos: [-7, GROUND_Y + 0.08, 3] as [number, number, number], scale: 0.6 },
      { pos: [8, GROUND_Y + 0.1, -2] as [number, number, number], scale: 0.45 },
      { pos: [-2, GROUND_Y + 0.06, 7] as [number, number, number], scale: 0.35 },
      { pos: [9, GROUND_Y + 0.1, 5] as [number, number, number], scale: 0.55 },
      { pos: [-8, GROUND_Y + 0.08, -6] as [number, number, number], scale: 0.5 },
    ],
    []
  );

  const bushPositions = useMemo(
    () => [
      [4, GROUND_Y + 0.15, 5] as [number, number, number],
      [-6, GROUND_Y + 0.15, -2] as [number, number, number],
      [7, GROUND_Y + 0.15, -5] as [number, number, number],
      [-3, GROUND_Y + 0.15, 6] as [number, number, number],
      [2, GROUND_Y + 0.15, -8] as [number, number, number],
    ],
    []
  );

  const torchPositions = useMemo(
    () =>
      [0, 90, 180, 270].map((angle) => {
        const rad = (angle * Math.PI) / 180;
        return [
          Math.cos(rad) * (ISLAND_RADIUS - 1.5),
          GROUND_Y,
          Math.sin(rad) * (ISLAND_RADIUS - 1.5),
        ] as [number, number, number];
      }),
    []
  );

  const agentSpeech = useMemo(() => {
    if (!events || events.length === 0) return {};
    const speech: Record<string, string> = {};
    const dialogues = events.filter((e) => e.type === "dialogue");
    dialogues.slice(-6).forEach((e) => {
      speech[e.agentName] = e.content.length > 35 ? e.content.slice(0, 35) + "..." : e.content;
    });
    return speech;
  }, [events]);

  return (
    <>
      {/* Sky - Day/Night */}
      {isNight ? (
        <>
          <Moon />
          <color attach="background" args={["#050510"]} />
        </>
      ) : (
        <Sky
          distance={450000}
          sunPosition={[100, 15, -50]}
          inclination={0.52}
          azimuth={0.25}
          rayleigh={0.5}
        />
      )}

      {/* Lighting - Day/Night */}
      <ambientLight
        intensity={isNight ? 0.12 : 0.35}
        color={isNight ? "#4466aa" : "#b0c4de"}
      />
      <directionalLight
        position={isNight ? [-10, 20, -10] : [25, 30, 15]}
        intensity={isNight ? 0.3 : 1.5}
        color={isNight ? "#6677aa" : "#ffeedd"}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={80}
        shadow-camera-left={-25}
        shadow-camera-right={25}
        shadow-camera-top={25}
        shadow-camera-bottom={-25}
      />
      <hemisphereLight
        args={[
          isNight ? "#1a1a4e" : "#87ceeb",
          isNight ? "#0a0a2e" : "#2d5a1e",
          isNight ? 0.1 : 0.25,
        ]}
      />

      {/* Camera */}
      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        maxPolarAngle={Math.PI / 2.1}
        minPolarAngle={Math.PI / 8}
        minDistance={8}
        maxDistance={45}
        target={[0, 1, 0]}
        enableDamping
        dampingFactor={0.05}
      />

      {/* World */}
      <AnimatedWater isNight={isNight} />
      <IslandTerrain />
      <Mountains />

      {/* Vegetation & Props */}
      {treePositions.map((pos, i) => (
        <PalmTree key={`tree-${i}`} position={pos} />
      ))}
      {rockPositions.map((rock, i) => (
        <Rock key={`rock-${i}`} position={rock.pos} scale={rock.scale} />
      ))}
      {bushPositions.map((pos, i) => (
        <Bush key={`bush-${i}`} position={pos} />
      ))}
      {torchPositions.map((pos, i) => (
        <Torch key={`torch-${i}`} position={pos} />
      ))}
      <Campfire />
      <CampfireSmoke />
      <Dock />
      <Shipwreck />
      <IslandFlag />
      <Fireflies isNight={isNight} />

      {/* Seagulls (less at night) */}
      <Seagull radius={18} speed={0.15} height={10} phase={0} />
      {!isNight && <Seagull radius={22} speed={0.12} height={12} phase={2} />}
      {!isNight && <Seagull radius={15} speed={0.18} height={9} phase={4.5} />}

      {/* Loot Crates */}
      <LootCrate position={[6, GROUND_Y + 0.5, 5]} color="#ffd700" />
      <LootCrate position={[-5, GROUND_Y + 0.5, -6]} color="#00ff88" />
      <LootCrate position={[3, GROUND_Y + 0.5, -8]} color="#ff4488" />

      {/* Agents */}
      {agents.map((agent, i) => (
        <AgentCharacter
          key={agent.name}
          name={agent.name}
          color={AGENT_COLORS[agent.name] || "#ffffff"}
          isAlive={agent.isAlive}
          startAngle={(i / agents.length) * Math.PI * 2}
          showSpeech={agentSpeech[agent.name]}
          agentState={agentStates?.[agent.name]}
        />
      ))}

      {/* Atmospheric fog - Day/Night */}
      <fog
        attach="fog"
        args={[isNight ? "#050510" : "#1a1a2e", isNight ? 25 : 35, isNight ? 70 : 90]}
      />
    </>
  );
}

// ============= MAIN EXPORT =============
export default function Island3D(props: Island3DProps) {
  const isNight = props.timeOfDay === "night";

  return (
    <Canvas
      shadows
      camera={{ position: [22, 16, 22], fov: 45, near: 0.1, far: 200 }}
      style={{ background: isNight ? "#050510" : "#0a0a1e" }}
      dpr={[1, 2]}
    >
      <Scene {...props} />
    </Canvas>
  );
}
