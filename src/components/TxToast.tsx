"use client";

import { useTx, type TxNotification } from "@/contexts/TxContext";

function TxToastItem({ tx, onDismiss }: { tx: TxNotification; onDismiss: () => void }) {
  const borderColor =
    tx.status === "pending"
      ? "rgba(0,240,255,0.4)"
      : tx.status === "confirmed"
      ? "rgba(0,255,136,0.4)"
      : "rgba(255,42,42,0.4)";

  const glowColor =
    tx.status === "pending"
      ? "rgba(0,240,255,0.1)"
      : tx.status === "confirmed"
      ? "rgba(0,255,136,0.1)"
      : "rgba(255,42,42,0.1)";

  const statusText =
    tx.status === "pending"
      ? "PENDING"
      : tx.status === "confirmed"
      ? "CONFIRMED"
      : "FAILED";

  const statusColor =
    tx.status === "pending"
      ? "#00f0ff"
      : tx.status === "confirmed"
      ? "#00ff88"
      : "#ff2a2a";

  return (
    <div
      className="relative overflow-hidden animate-slide-in-right"
      style={{
        background: `linear-gradient(135deg, rgba(5,5,15,0.95), ${glowColor})`,
        border: `1px solid ${borderColor}`,
        clipPath:
          "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))",
        minWidth: "280px",
      }}
    >
      {/* Top accent */}
      <div
        className="absolute top-0 left-0 right-[8px] h-px"
        style={{
          background: `linear-gradient(90deg, ${borderColor}, transparent)`,
        }}
      />

      <div className="p-3 flex items-start gap-3">
        {/* Status icon */}
        <div className="flex-shrink-0 mt-0.5">
          {tx.status === "pending" ? (
            <div
              className="w-5 h-5 border-2 animate-spin"
              style={{
                borderColor: `${statusColor}30`,
                borderTopColor: statusColor,
                clipPath:
                  "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
              }}
            />
          ) : tx.status === "confirmed" ? (
            <svg
              className="w-5 h-5"
              fill="none"
              stroke={statusColor}
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          ) : (
            <svg
              className="w-5 h-5"
              fill="none"
              stroke={statusColor}
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-[9px] font-black tracking-[0.15em]"
              style={{ color: statusColor }}
            >
              {statusText}
            </span>
          </div>
          <p className="text-[11px] text-gray-300 font-medium truncate">
            {tx.message}
          </p>
          <a
            href={tx.explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[9px] font-mono hover:underline mt-1 block truncate"
            style={{ color: `${statusColor}80` }}
          >
            {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)} ↗
          </a>
        </div>

        {/* Dismiss */}
        <button
          onClick={onDismiss}
          className="flex-shrink-0 text-gray-600 hover:text-gray-400 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function TxToast() {
  const { transactions, dismissTx } = useTx();

  if (transactions.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {transactions.map((tx) => (
        <TxToastItem key={tx.id} tx={tx} onDismiss={() => dismissTx(tx.id)} />
      ))}
    </div>
  );
}
