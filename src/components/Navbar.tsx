"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWeb3 } from "@/contexts/Web3Context";

function shortenAddress(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

const NAV_LINKS = [
  { href: "/game", label: "PLAY", icon: "M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" },
  { href: "/mint", label: "MINT", icon: "M12 4v16m8-8H4" },
  { href: "/vote", label: "RANKS", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
];

export default function Navbar() {
  const { account, balance, isConnected, isConnecting, isCorrectNetwork, connectWallet, disconnectWallet } = useWeb3();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/60 backdrop-blur-xl border-b border-red-500/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 avax-gradient rounded flex items-center justify-center font-black text-white text-[10px] tracking-wider">
              AI
            </div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-black text-white tracking-wider uppercase">SURVIVAL</span>
              <span className="text-sm font-black gradient-text tracking-wider uppercase">ISLAND</span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded text-xs font-bold transition-all uppercase tracking-wider ${
                    isActive
                      ? "text-white bg-white/10 border-b-2 border-red-500"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d={link.icon} />
                  </svg>
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Right side: Wallet + Hamburger */}
          <div className="flex items-center gap-2">
            {/* Wallet */}
            <div>
              {isConnected && account ? (
                <button
                  onClick={disconnectWallet}
                  className="flex items-center gap-2 px-3 py-1.5 rounded bg-green-500/10 border border-green-500/20 hover:bg-red-500/10 hover:border-red-500/20 transition-colors group"
                >
                  <div className={`w-2 h-2 rounded-full animate-pulse ${isCorrectNetwork ? "bg-green-500" : "bg-red-500"}`} />
                  <span className="text-xs text-green-400 font-mono font-bold group-hover:hidden">
                    {balance ? `${parseFloat(balance).toFixed(3)} AVAX | ` : ""}{shortenAddress(account)}
                  </span>
                  <span className="text-xs text-red-400 font-mono font-bold hidden group-hover:inline">
                    DISCONNECT
                  </span>
                </button>
              ) : (
                <button
                  onClick={connectWallet}
                  disabled={isConnecting}
                  className="avax-gradient px-4 py-1.5 rounded text-white text-xs font-bold tracking-wider uppercase hover:scale-105 transition-all disabled:opacity-50"
                >
                  {isConnecting ? "..." : "CONNECT"}
                </button>
              )}
            </div>

            {/* Hamburger button (mobile only) */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden flex flex-col justify-center items-center w-8 h-8 gap-1.5"
              aria-label="Toggle menu"
            >
              <span className={`block w-5 h-0.5 bg-gray-400 transition-all duration-200 ${mobileOpen ? "rotate-45 translate-y-2" : ""}`} />
              <span className={`block w-5 h-0.5 bg-gray-400 transition-all duration-200 ${mobileOpen ? "opacity-0" : ""}`} />
              <span className={`block w-5 h-0.5 bg-gray-400 transition-all duration-200 ${mobileOpen ? "-rotate-45 -translate-y-2" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div
          className="md:hidden border-t border-red-500/10 animate-slide-in-left"
          style={{ background: "rgba(5,5,15,0.95)", backdropFilter: "blur(20px)" }}
        >
          <div className="px-4 py-3 space-y-1">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-all uppercase tracking-wider ${
                    isActive
                      ? "text-white bg-white/10 border-l-2 border-red-500"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d={link.icon} />
                  </svg>
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
