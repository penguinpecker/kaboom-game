"use client";
import { useGame, GameResult } from "@/hooks/useGame";
import { useAccount } from "wagmi";
import { useState, useMemo } from "react";

export default function LogsPage() {
  const { address } = useAccount();
  const { gameHistory } = useGame();
  const [filter, setFilter] = useState<"all" | "wins" | "losses">("all");

  const filtered = useMemo(() => {
    let logs = gameHistory;
    if (filter === "wins") logs = logs.filter(l => l.won);
    if (filter === "losses") logs = logs.filter(l => !l.won);
    return logs;
  }, [gameHistory, filter]);

  const myLogs = useMemo(() => {
    if (!address) return filtered;
    return filtered.filter(l => l.player.toLowerCase() === address.toLowerCase());
  }, [filtered, address]);

  const stats = useMemo(() => {
    const all = gameHistory;
    const wins = all.filter(g => g.won);
    const losses = all.filter(g => !g.won);
    return {
      pnl: wins.reduce((s, g) => s + g.payout - g.bet, 0) - losses.reduce((s, g) => s + g.bet, 0),
      winRate: all.length > 0 ? (wins.length / all.length * 100) : 0,
      totalGames: all.length,
      avgMult: wins.length > 0 ? wins.reduce((s, g) => s + g.multiplier, 0) / wins.length : 0,
    };
  }, [gameHistory]);

  return (
    <div className="px-6 lg:px-8 pb-16 min-h-screen">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="font-headline text-3xl font-black italic tracking-tighter text-on-surface mb-0.5">COMBAT LOG</h1>
          <p className="text-xs text-on-surface-variant">All games cached locally. Tx hashes link to on-chain explorer.</p>
        </div>
        <div className="flex gap-1">
          {(["all", "wins", "losses"] as const).map((t) => (
            <button key={t} onClick={() => setFilter(t)}
              className={`px-3 py-1 font-headline text-[10px] font-bold tracking-widest capitalize transition-colors ${t === filter ? "bg-primary/10 text-primary border border-primary/15" : "text-on-surface-variant/40 hover:text-on-surface"}`}>{t}</button>
          ))}
        </div>
      </div>

      {/* Stats from cache */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-surface-container-low p-4 border border-outline-variant/10">
          <span className="font-headline text-[10px] text-on-surface-variant/40 uppercase tracking-widest block">PnL</span>
          <span className={`font-headline text-lg font-bold ${stats.pnl >= 0 ? "text-primary" : "text-error"}`}>
            {stats.pnl >= 0 ? "+" : ""}{stats.pnl.toFixed(3)} STT
          </span>
        </div>
        <div className="bg-surface-container-low p-4 border border-outline-variant/10">
          <span className="font-headline text-[10px] text-on-surface-variant/40 uppercase tracking-widest block">Win Rate</span>
          <span className="font-headline text-lg font-bold text-secondary">{stats.winRate.toFixed(1)}%</span>
        </div>
        <div className="bg-surface-container-low p-4 border border-outline-variant/10">
          <span className="font-headline text-[10px] text-on-surface-variant/40 uppercase tracking-widest block">Avg Mult</span>
          <span className="font-headline text-lg font-bold text-tertiary">{stats.avgMult.toFixed(2)}×</span>
        </div>
        <div className="bg-surface-container-low p-4 border border-outline-variant/10">
          <span className="font-headline text-[10px] text-on-surface-variant/40 uppercase tracking-widest block">Games</span>
          <span className="font-headline text-lg font-bold text-on-surface">{stats.totalGames}</span>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="bg-surface-container-low border border-outline-variant/10">
        <div className="grid grid-cols-7 px-5 py-2 border-b border-outline-variant/10">
          {["Game", "Result", "Bet", "Payout", "Mult", "Mines", "Tx"].map((h) => (
            <span key={h} className="font-headline text-[10px] tracking-widest text-on-surface-variant/40 uppercase">{h}</span>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="px-5 py-12 text-center text-on-surface-variant text-sm">
            {gameHistory.length === 0 ? "No games played yet. Play a game to see logs here." : "No matching games."}
          </div>
        ) : (
          filtered.slice(0, 50).map((g, i) => (
            <div key={`${g.gameId}-${g.timestamp}`} className="grid grid-cols-7 px-5 py-3 items-center hover:bg-surface-container/30 border-b border-outline-variant/[0.04]">
              <span className="font-headline text-xs text-on-surface">#{g.gameId}</span>
              <span className={`flex items-center gap-1 font-headline text-xs ${g.won ? "text-primary" : "text-error"}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${g.won ? "bg-emerald" : "bg-error"}`} />
                {g.won ? "WON" : "LOST"}
              </span>
              <span className="font-headline text-xs text-on-surface">{g.bet.toFixed(3)}</span>
              <span className={`font-headline text-xs font-bold ${g.won ? "text-primary" : "text-error"}`}>
                {g.won ? `+${g.payout.toFixed(3)}` : `-${g.bet.toFixed(3)}`}
              </span>
              <span className="font-headline text-xs text-secondary">{g.won ? g.multiplier.toFixed(2) + "×" : "—"}</span>
              <span className="font-headline text-xs text-on-surface-variant">{g.mineCount}m / {g.tilesCleared}t</span>
              <a href={`https://shannon-explorer.somnia.network/tx/${g.txHash}`} target="_blank" rel="noreferrer"
                className="font-mono text-[9px] text-primary hover:underline truncate">
                {g.txHash ? `${g.txHash.slice(0, 10)}…` : "—"}
              </a>
            </div>
          ))
        )}
      </div>

      {gameHistory.length > 0 && (
        <div className="mt-4 text-center">
          <button onClick={() => { localStorage.removeItem("kaboom_game_history"); window.location.reload(); }}
            className="font-headline text-[10px] text-on-surface-variant/30 hover:text-error transition-colors tracking-widest">
            CLEAR CACHE
          </button>
        </div>
      )}
    </div>
  );
}
