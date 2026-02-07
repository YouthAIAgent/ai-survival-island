"use client";

import { useState } from "react";
import { ethers } from "ethers";
import AgentCard from "@/components/AgentCard";
import { useWeb3 } from "@/contexts/Web3Context";
import { useTx } from "@/contexts/TxContext";
import {
  areContractsDeployed,
  getAgentNFTContract,
  AGENT_NFT_ABI,
  getExplorerTxUrl,
} from "@/lib/contracts";

const PERSONALITY_OPTIONS = [
  { value: "mastermind", label: "The Mastermind", desc: "Quiet, calculating, always three steps ahead" },
  { value: "hothead", label: "The Hothead", desc: "Loud, confrontational, fiercely loyal to allies" },
  { value: "charmer", label: "The Charmer", desc: "Sweet on the surface, deadly underneath" },
  { value: "protector", label: "The Protector", desc: "Strong, loyal, will die for allies" },
  { value: "backstabber", label: "The Backstabber", desc: "Brilliant and witty, will betray anyone to win" },
  { value: "diplomat", label: "The Diplomat", desc: "Calm, wise, seeks peace but has a secret edge" },
  { value: "wildcard", label: "The Wildcard", desc: "Unpredictable, chaotic, keeps everyone guessing" },
  { value: "shadow", label: "The Shadow", desc: "Works behind the scenes, pulls strings unseen" },
];

interface MintedAgent {
  tokenId?: string;
  txHash?: string;
  traits: {
    charisma: number;
    strategy: number;
    loyalty: number;
    aggression: number;
    wit: number;
  };
}

export default function MintPage() {
  const [name, setName] = useState("");
  const [personality, setPersonality] = useState("");
  const [minting, setMinting] = useState(false);
  const [minted, setMinted] = useState(false);
  const [mintedAgent, setMintedAgent] = useState<MintedAgent | null>(null);

  const { isConnected, signer, connectWallet } = useWeb3();
  const { addTx } = useTx();

  const contractsDeployed = areContractsDeployed();

  // Preview traits (simulated)
  const previewTraits = personality
    ? {
        charisma: Math.floor(Math.random() * 60 + 40),
        strategy: Math.floor(Math.random() * 60 + 40),
        loyalty: Math.floor(Math.random() * 60 + 40),
        aggression: Math.floor(Math.random() * 60 + 40),
        wit: Math.floor(Math.random() * 60 + 40),
      }
    : null;

  async function handleMint() {
    if (!name || !personality) return;

    setMinting(true);

    try {
      if (contractsDeployed && isConnected && signer) {
        // Real on-chain mint
        const contract = getAgentNFTContract(signer);
        let mintPrice: bigint;
        try {
          mintPrice = await contract.mintPrice();
        } catch {
          mintPrice = ethers.parseEther("0.1");
        }

        const tx = await contract.mint(name, personality, { value: mintPrice });
        addTx(tx.hash, `Minting ${name}...`);
        const receipt = await tx.wait();

        // Parse AgentMinted event from receipt
        let tokenId: string | undefined;
        const iface = new ethers.Interface(AGENT_NFT_ABI);
        for (const log of receipt.logs) {
          try {
            const parsed = iface.parseLog({ topics: [...log.topics], data: log.data });
            if (parsed && parsed.name === "AgentMinted") {
              tokenId = parsed.args.tokenId.toString();
              break;
            }
          } catch {
            // Not our event, skip
          }
        }

        // Fetch on-chain traits
        let traits = previewTraits || { charisma: 50, strategy: 50, loyalty: 50, aggression: 50, wit: 50 };
        if (tokenId) {
          try {
            const agentTraits = await contract.getAgentTraits(BigInt(tokenId));
            traits = {
              charisma: Number(agentTraits.charisma),
              strategy: Number(agentTraits.strategy),
              loyalty: Number(agentTraits.loyalty),
              aggression: Number(agentTraits.aggression),
              wit: Number(agentTraits.wit),
            };
          } catch {
            // Use preview traits as fallback
          }
        }

        setMintedAgent({ tokenId, txHash: tx.hash, traits });
        setMinted(true);
      } else {
        // Demo mode - simulate minting
        await new Promise((resolve) => setTimeout(resolve, 2000));
        setMintedAgent({
          traits: previewTraits || { charisma: 50, strategy: 50, loyalty: 50, aggression: 50, wit: 50 },
        });
        setMinted(true);
      }
    } catch (err: any) {
      // Silently handle user rejection
      if (err.code === 4001 || err.code === "ACTION_REJECTED") {
        // User rejected - do nothing
      } else {
        alert("Error minting: " + (err.reason || err.message));
      }
    }

    setMinting(false);
  }

  if (minted && mintedAgent) {
    return (
      <div className="min-h-screen pt-24 px-4">
        <div className="max-w-md mx-auto text-center">
          <div className="text-6xl mb-6 animate-float">🎉</div>
          <h1 className="text-3xl font-bold text-white mb-4">Agent Minted!</h1>
          <p className="text-gray-400 mb-4">
            <strong className="text-white">{name}</strong> has been born on the Avalanche blockchain.
            Your agent is ready to enter the island!
          </p>

          {mintedAgent.tokenId && (
            <p className="text-sm text-cyan-400 font-mono mb-2">
              Token ID: #{mintedAgent.tokenId}
            </p>
          )}

          {mintedAgent.txHash && (
            <a
              href={getExplorerTxUrl(mintedAgent.txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-xs text-cyan-500/70 hover:text-cyan-400 font-mono mb-6 hover:underline"
            >
              View on Snowtrace ↗
            </a>
          )}

          {!mintedAgent.txHash && <div className="mb-6" />}

          <div className="mb-8">
            <AgentCard
              name={name}
              personality={PERSONALITY_OPTIONS.find((p) => p.value === personality)?.label || personality}
              {...mintedAgent.traits}
              isAlive={true}
              showStats={true}
            />
          </div>

          <div className="flex gap-3 justify-center">
            <a
              href="/game"
              className="avax-gradient px-6 py-3 rounded-xl text-white font-bold hover:opacity-90"
            >
              Enter a Game
            </a>
            <button
              onClick={() => {
                setMinted(false);
                setMintedAgent(null);
                setName("");
                setPersonality("");
              }}
              className="glass-card px-6 py-3 rounded-xl text-white font-bold hover:bg-white/10"
            >
              Mint Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">🤖</div>
          <h1 className="text-3xl font-bold text-white mb-2">Mint Your AI Agent</h1>
          <p className="text-gray-400">
            Create a unique AI agent NFT with its own personality. Each agent thinks
            and acts autonomously using Claude AI.
          </p>
          {!contractsDeployed && (
            <div className="inline-flex items-center gap-2 mt-3 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
              <span className="text-[10px] font-bold text-yellow-400 tracking-wider uppercase">Demo Mode</span>
            </div>
          )}
        </div>

        <div className="glass-card rounded-2xl p-6 space-y-6">
          {/* Agent Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Agent Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter a name for your agent..."
              maxLength={20}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>

          {/* Personality Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Personality Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              {PERSONALITY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setPersonality(option.value)}
                  className={`text-left p-3 rounded-lg border transition-all ${
                    personality === option.value
                      ? "border-red-500 bg-red-900/30"
                      : "border-gray-700 bg-gray-800/30 hover:border-gray-500"
                  }`}
                >
                  <div className="font-medium text-white text-sm">{option.label}</div>
                  <div className="text-xs text-gray-400 mt-1">{option.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Mint Cost Info */}
          <div className="bg-gray-800/50 rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-300">Mint Cost</p>
              <p className="text-xs text-gray-500">On Avalanche C-Chain</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-white">0.1 AVAX</p>
              <p className="text-xs text-gray-500">+ gas fees</p>
            </div>
          </div>

          {/* Connect Wallet Prompt or Mint Button */}
          {contractsDeployed && !isConnected ? (
            <button
              onClick={connectWallet}
              className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 py-4 rounded-xl text-white font-bold text-lg hover:opacity-90 transition-opacity"
            >
              Connect Wallet to Mint
            </button>
          ) : (
            <button
              onClick={handleMint}
              disabled={!name || !personality || minting}
              className="w-full avax-gradient py-4 rounded-xl text-white font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
            >
              {minting
                ? "Minting on Avalanche..."
                : contractsDeployed && isConnected
                ? "Mint Agent NFT (0.1 AVAX)"
                : "Mint Agent NFT (Demo)"}
            </button>
          )}

          <p className="text-xs text-gray-500 text-center">
            Your agent&apos;s traits (Charisma, Strategy, Loyalty, Aggression, Wit) are
            randomly generated on-chain for fairness.
          </p>
        </div>
      </div>
    </div>
  );
}
