"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { ethers } from "ethers";
import { getExplorerTxUrl } from "@/lib/contracts";

export interface TxNotification {
  id: string;
  hash: string;
  status: "pending" | "confirmed" | "failed";
  message: string;
  explorerUrl: string;
}

interface TxState {
  transactions: TxNotification[];
  addTx: (hash: string, message: string) => void;
  dismissTx: (id: string) => void;
}

const TxContext = createContext<TxState>({
  transactions: [],
  addTx: () => {},
  dismissTx: () => {},
});

export function useTx() {
  return useContext(TxContext);
}

export function TxProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<TxNotification[]>([]);

  const dismissTx = useCallback((id: string) => {
    setTransactions((prev) => prev.filter((tx) => tx.id !== id));
  }, []);

  const addTx = useCallback((hash: string, message: string) => {
    const id = `tx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const notification: TxNotification = {
      id,
      hash,
      status: "pending",
      message,
      explorerUrl: getExplorerTxUrl(hash),
    };

    setTransactions((prev) => [...prev, notification]);

    // Track transaction
    (async () => {
      try {
        if (typeof window !== "undefined" && (window as any).ethereum) {
          const provider = new ethers.BrowserProvider((window as any).ethereum);
          const receipt = await provider.waitForTransaction(hash);
          const status = receipt && receipt.status === 1 ? "confirmed" : "failed";
          setTransactions((prev) =>
            prev.map((tx) => (tx.id === id ? { ...tx, status } : tx))
          );
        }
      } catch {
        setTransactions((prev) =>
          prev.map((tx) => (tx.id === id ? { ...tx, status: "failed" } : tx))
        );
      }

      // Auto-dismiss after 8 seconds
      setTimeout(() => {
        setTransactions((prev) => prev.filter((tx) => tx.id !== id));
      }, 8000);
    })();
  }, []);

  return (
    <TxContext.Provider value={{ transactions, addTx, dismissTx }}>
      {children}
    </TxContext.Provider>
  );
}
