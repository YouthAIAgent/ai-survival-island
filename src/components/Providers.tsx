"use client";

import type { ReactNode } from "react";
import { Web3Provider } from "@/contexts/Web3Context";
import { TxProvider } from "@/contexts/TxContext";
import TxToast from "@/components/TxToast";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <Web3Provider>
      <TxProvider>
        {children}
        <TxToast />
      </TxProvider>
    </Web3Provider>
  );
}
