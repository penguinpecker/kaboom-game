"use client";
import { useModal } from "@/hooks/useModal";
import { usePublicClient, useAccount } from "wagmi";
import { useState, useEffect } from "react";
import { CONTRACTS } from "@/lib/chain";
import { KaboomGameAbi } from "@/lib/abis";
import { formatEther } from "viem";

interface GameLog {
  gameId: string;
  player: string;
  won: boolean;
  amount: string;
  multiplier: string;
  blockNumber: string;
  txHash: string;
}

export default function LogsPage() {
  const { open } = useModal();
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [logs, setLogs] = useState<GameLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "wins" | "losses">("all");

  useEffect(() => {
    if (!publicClient) return;
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const events = await publicClient.getLogs({
          address: CONTRACTS.KaboomGame,
          event: {
            type: "event",
            name: "GameSettled",
            inputs: [
              { indexed: true, name: "gameId", type: "uint256" },
              { indexed: true, name: "player", type: "address" },
              { indexed: false, name: "won", type: "bool" },
              { indexed: false, name: "amount", type: "uint256" },
              { indexed: false, name: "multiplier", type: "uint256" },
            ],
          },
          fromBlock: BigInt(0),
          toBlock: "latest",
        });

        const parsed = events.map((e) => ({
          gameId: e.args.gameId?.toString() || "0",
          player: e.args.player || "0x0",
          won: e.args.won || false,
          amount: e.args.amount ? formatEther(e.args.amount) : "0",
          multiplier: e.args.multiplier ? (Number(e.args.multiplier) / 1e18).toFixed(2) : "0",
          blockNumber: e.blockNumber?.toString() || "0",
          txHash: e.transactionHash || "0x0",
        })).reverse(); // newest first

        setLogs(parsed);
      } catch (err) {
        console.error("Failed to fetch logs:", err);
      }
      setLoading(false);
    };
    fetchLogs();
  }, [publicClient]);

  const filtered = filter === "wins" ? logs.filter(l => l.won) : filter === "losses" ? logs.filter(l => !l.won) : logs;
  const myLogs = address ? filtered.filter(l => l.player.toLowerCase() === address.toLowerCase()) : [];
  const totalWon = myLogs.filter(l => l.won).reduce((s, l) => s + Number(l.amount), 0);
  const totalLost = myLogs.filter(l => !l.won).reduce((s, l) => s + Number(l.amount), 0);

  return (
    <div className="px-6 lg:px-8 pb-16 min-h-screen">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="font-headline text-3xl font-black italic tracking-tighter text-on-surface mb-0.5">COMBAT LOG</h1>
          <p className="text-xs text-on-surface-variant">All games from chain. Verified on-chain via GameSettled events.</p>
        </div>
        <div className="flex gap-1">
          {(["all", "wins", "losses"] as const).map((t) => (
            <button key={t} onClick={() => setFilter(t)}
              className={`px-3 py-1 font-headline text-[10px] font-bold tracking-widest capitalize transition-colors ${t === filter ? "bg-primary/10 text-primary border border-primary/15" : "text-on-surface-variant/40 hover:text-on-surface"}`}>{t}</button>
          ))}
        </div>
      </div>

      {/* My Stats (from real events) */}
      {address && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-surface-container-low p-4 border border-outline-variant/10">
            <span className="font-headline text-[10px] text-on-surface-variant/40 uppercase tracking-widest block">PnL</span>
            <span className={`font-headline text-lg font-bold ${totalWon - totalLost >= 0 ? "text-primary" : "text-error"}`}>
              {(totalWon - totalLost) >= 0 ? "+" : ""}{(totalWon - totalLost).toFixed(3)} STT
            </span>
          </div>
          <div className="bg-surface-container-low p-4 border border-outline-variant/10">
            <span className="font-headline text-[10px] text-on-surface-variant/40 uppercase tracking-widest block">Win Rate</span>
            <span className="font-headline text-lg font-bold text-secondary">
              {myLogs.length > 0 ? ((myLogs.filter(l => l.won).length / myLogs.length) * 100).toFixed(1) : "—"}%
            </span>
          </div>
          <div className="bg-surface-container-low p-4 border border-outline-variant/10">
            <span className="font-headline text-[10px] text-on-surface-variant/40 uppercase tracking-widest block">My Games</span>
            <span className="font-headline text-lg font-bold text-on-surface">{myLogs.length}</span>
          </div>
          <div className="bg-surface-container-low p-4 border border-outline-variant/10">
            <span className="font-headline text-[10px] text-on-surface-variant/40 uppercase tracking-widest block">All Games</span>
            <span className="font-headline text-lg font-bold text-tertiary">{logs.length}</span>
          </div>
        </div>
      )}

      {/* Event Table */}
      <div className="bg-surface-container-low border border-outline-variant/10">
        <div className="grid grid-cols-6 px-5 py-2 border-b border-outline-variant/10">
          {["Game", "Player", "Result", "Amount", "Mult", "Tx"].map((h) => (
            <span key={h} className="font-headline text-[10px] tracking-widest text-on-surface-variant/40 uppercase">{h}</span>
          ))}
        </div>

        {loading ? (
          <div className="px-5 py-12 text-center text-on-surface-variant text-sm flex items-center justify-center gap-2">
            <span className="material-symbols-outlined animate-spin" style={{ fontSize: 20 }}>progress_activity</span>
            Fetching on-chain events...
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-12 text-center text-on-surface-variant text-sm">
            No games found. Play a game to see events here.
          </div>
        ) : (
          filtered.slice(0, 50).map((l) => (
            <div key={l.gameId + l.txHash} className="grid grid-cols-6 px-5 py-3 items-center hover:bg-surface-container/30 border-b border-outline-variant/[0.04]">
              <span className="font-headline text-xs text-on-surface">#{l.gameId}</span>
              <span className="font-mono text-[10px] text-on-surface-variant">
                {l.player.slice(0, 6)}…{l.player.slice(-4)}
              </span>
              <span className={`flex items-center gap-1 font-headline text-xs ${l.won ? "text-primary" : "text-error"}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${l.won ? "bg-emerald" : "bg-error"}`} />
                {l.won ? "WON" : "LOST"}
              </span>
              <span className={`font-headline text-xs ${l.won ? "text-primary" : "text-error"}`}>
                {l.won ? "+" : "-"}{Number(l.amount).toFixed(3)} STT
              </span>
              <span className="font-headline text-xs text-secondary">{l.multiplier}×</span>
              <a href={`https://shannon-explorer.somnia.network/tx/${l.txHash}`} target="_blank" rel="noreferrer"
                className="font-mono text-[9px] text-primary hover:underline truncate">{l.txHash.slice(0, 10)}…</a>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
