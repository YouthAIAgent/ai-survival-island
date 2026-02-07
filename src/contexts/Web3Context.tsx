"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { ethers } from "ethers";
import { AVALANCHE_FUJI, switchToAvalancheFuji } from "@/lib/contracts";

interface Web3State {
  account: string | null;
  balance: string | null;
  chainId: number | null;
  isConnected: boolean;
  isCorrectNetwork: boolean;
  isConnecting: boolean;
  signer: ethers.Signer | null;
  error: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchNetwork: () => Promise<void>;
}

const Web3Context = createContext<Web3State>({
  account: null,
  balance: null,
  chainId: null,
  isConnected: false,
  isCorrectNetwork: false,
  isConnecting: false,
  signer: null,
  error: null,
  connectWallet: async () => {},
  disconnectWallet: () => {},
  switchNetwork: async () => {},
});

export function useWeb3() {
  return useContext(Web3Context);
}

export function Web3Provider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isConnected = !!account;
  const isCorrectNetwork = chainId === AVALANCHE_FUJI.chainId;

  const updateBalance = useCallback(async (address: string) => {
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const bal = await provider.getBalance(address);
      setBalance(ethers.formatEther(bal));
    } catch {
      setBalance(null);
    }
  }, []);

  const setupAccount = useCallback(async (address: string) => {
    setAccount(address);
    setError(null);
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const s = await provider.getSigner();
      setSigner(s);
      await updateBalance(address);
    } catch {
      setSigner(null);
    }
  }, [updateBalance]);

  // Auto-detect existing connection on mount
  useEffect(() => {
    if (typeof window === "undefined" || !(window as any).ethereum) return;

    const eth = (window as any).ethereum;

    (async () => {
      try {
        const accounts: string[] = await eth.request({ method: "eth_accounts" });
        if (accounts.length > 0) {
          await setupAccount(accounts[0]);
        }
        const chain = await eth.request({ method: "eth_chainId" });
        setChainId(parseInt(chain, 16));
      } catch {}
    })();

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        setAccount(null);
        setBalance(null);
        setSigner(null);
        setChainId(null);
      } else {
        setupAccount(accounts[0]);
      }
    };

    const handleChainChanged = (chain: string) => {
      setChainId(parseInt(chain, 16));
      // Re-setup signer for new chain
      if (account) {
        setupAccount(account);
      }
    };

    eth.on("accountsChanged", handleAccountsChanged);
    eth.on("chainChanged", handleChainChanged);

    return () => {
      eth.removeListener("accountsChanged", handleAccountsChanged);
      eth.removeListener("chainChanged", handleChainChanged);
    };
  }, [account, setupAccount]);

  const connectWallet = useCallback(async () => {
    if (typeof window === "undefined" || !(window as any).ethereum) {
      setError("Please install MetaMask or Core Wallet!");
      return;
    }
    setIsConnecting(true);
    setError(null);
    try {
      await switchToAvalancheFuji();
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const accounts: string[] = await provider.send("eth_requestAccounts", []);
      if (accounts.length > 0) {
        await setupAccount(accounts[0]);
      }
      const chain = await (window as any).ethereum.request({ method: "eth_chainId" });
      setChainId(parseInt(chain, 16));
    } catch (err: any) {
      if (err.code !== 4001) {
        setError(err.message || "Failed to connect wallet");
      }
    }
    setIsConnecting(false);
  }, [setupAccount]);

  const disconnectWallet = useCallback(() => {
    setAccount(null);
    setBalance(null);
    setSigner(null);
    setChainId(null);
    setError(null);
  }, []);

  const switchNetwork = useCallback(async () => {
    try {
      await switchToAvalancheFuji();
    } catch (err: any) {
      setError(err.message || "Failed to switch network");
    }
  }, []);

  return (
    <Web3Context.Provider
      value={{
        account,
        balance,
        chainId,
        isConnected,
        isCorrectNetwork,
        isConnecting,
        signer,
        error,
        connectWallet,
        disconnectWallet,
        switchNetwork,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}
