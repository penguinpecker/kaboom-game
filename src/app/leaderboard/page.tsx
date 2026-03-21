"use client";
import { useLeaderboard, usePlayerStats, useGameCounter } from "@/hooks/useContracts";
import { useGame, GameResult } from "@/hooks/useGame";
import { useAccount } from "wagmi";
import { formatEther } from "viem";
import { useMemo } from "react";

export default function LeaderboardPage() {
  const { address } = useAccount();
  const { data: leaders } = useLeaderboard();
  const { data: myStats } = usePlayerStats(address);
  const { data: gameCount } = useGameCounter();
  const { gameHistory } = useGame();

  // Compute local stats from cache
  const localStats = useMemo(() => {
    if (!address || !gameHistory.length) return null;
    const myGames = gameHistory.filter(g => g.player.toLowerCase() === address.toLowerCase());
    if (!myGames.length) return null;
    return {
      totalWon: myGames.filter(g => g.won).reduce((s, g) => s + g.payout, 0),
      gamesWon: myGames.filter(g => g.won).length,
      gamesPlayed: myGames.length,
      biggestWin: Math.max(...myGames.filter(g => g.won).map(g => g.payout), 0),
      biggestMult: Math.max(...myGames.filter(g => g.won).map(g => g.multiplier), 0),
      totalPnl: myGames.reduce((s, g) => s + (g.won ? g.payout - g.bet : -g.bet), 0),
      winRate: myGames.length > 0 ? (myGames.filter(g => g.won).length / myGames.length * 100) : 0,
    };
  }, [address, gameHistory]);

  // On-chain stats (may be zero if reactive handlers haven't fired yet)
  const chainStats = myStats ? {
    totalWon: Number(formatEther((myStats as any).totalWon)),
    gamesWon: Number((myStats as any).gamesWon),
    biggestWin: Number(formatEther((myStats as any).biggestWin)),
    biggestMult: Number((myStats as any).biggestMultiplier) / 1e18,
  } : null;

  // Prefer chain stats, fall back to local
  const displayStats = chainStats && chainStats.gamesWon > 0 ? chainStats : localStats;

  return (
    <div className="px-6 lg:px-8 pb-16 min-h-screen">
      <div className="flex justify-between items-end mb-8">
        <div>
          <p className="font-headline text-[10px] tracking-[.12em] text-on-surface-variant flex items-center gap-1 mb-0.5">
            <span className="status-dot" />REACTIVE AUTO-RANKED ON-CHAIN
          </p>
          <h1 className="font-headline text-3xl font-black italic tracking-tighter text-on-surface">
            GLOBAL <span className="text-primary">LEADERBOARD</span>
          </h1>
        </div>
        <div className="font-headline text-sm text-on-surface-variant">
          Total Games: <span className="text-secondary font-bold">{gameCount ? gameCount.toString() : gameHistory.length.toString()}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        {/* Rankings Table — chain + local hybrid */}
        <div className="bg-surface-container-low border border-outline-variant/10 stealth-card">
          <div className="px-5 py-3 border-b border-outline-variant/10">
            <h2 className="font-headline text-xs font-bold tracking-widest text-white uppercase flex items-center gap-1.5">
              <span className="material-symbols-outlined text-amber mi" style={{ fontSize: 18 }}>emoji_events</span>Rankings
            </h2>
          </div>
          <div className="grid grid-cols-4 px-5 py-2 border-b border-outline-variant/10">
            <span className="font-headline text-[10px] tracking-widest text-on-surface-variant/40 uppercase">Rank</span>
            <span className="font-headline text-[10px] tracking-widest text-on-surface-variant/40 uppercase">Player</span>
            <span className="font-headline text-[10px] tracking-widest text-on-surface-variant/40 uppercase">Biggest Win</span>
            <span className="font-headline text-[10px] tracking-widest text-on-surface-variant/40 uppercase text-right">Best Mult</span>
          </div>

          {/* On-chain leaderboard entries */}
          {leaders && ([...leaders] as any[]).some((e: any) => e.player !== "0x0000000000000000000000000000000000000000") ? (
            ([...leaders] as any[]).map((entry: any, i: number) => {
              if (entry.player === "0x0000000000000000000000000000000000000000") return null;
              const isMe = address && entry.player.toLowerCase() === address.toLowerCase();
              return (
                <div key={i} className={`grid grid-cols-4 px-5 py-3 items-center border-b border-outline-variant/[0.04] ${isMe ? "bg-primary/5" : "hover:bg-surface-container/30"}`}>
                  <span className={`w-7 h-7 rounded-full font-headline font-bold text-[10px] flex items-center justify-center ${i === 0 ? "bg-amber/10 text-amber" : i < 3 ? "bg-on-surface-variant/[0.06] text-on-surface-variant/60" : "bg-surface-container-highest text-on-surface-variant/40"}`}>
                    #{i + 1}
                  </span>
                  <span className="font-headline text-xs text-on-surface font-mono">
                    {isMe ? "YOU" : `${entry.player.slice(0, 6)}…${entry.player.slice(-4)}`}
                  </span>
                  <span className="font-headline text-xs text-primary font-bold">
                    {Number(formatEther(entry.biggestWin)).toFixed(3)} STT
                  </span>
                  <span className="font-headline text-xs text-secondary font-bold text-right">
                    {(Number(entry.biggestMultiplier) / 1e18).toFixed(2)}×
                  </span>
                </div>
              );
            })
          ) : (
            /* Fall back to local cache leaderboard */
            gameHistory.filter(g => g.won).length > 0 ? (
              (() => {
                const playerMap = new Map<string, { biggestWin: number; biggestMult: number }>();
                gameHistory.filter(g => g.won).forEach(g => {
                  const existing = playerMap.get(g.player) || { biggestWin: 0, biggestMult: 0 };
                  playerMap.set(g.player, {
                    biggestWin: Math.max(existing.biggestWin, g.payout),
                    biggestMult: Math.max(existing.biggestMult, g.multiplier),
                  });
                });
                return Array.from(playerMap.entries())
                  .sort((a, b) => b[1].biggestWin - a[1].biggestWin)
                  .slice(0, 10)
                  .map(([player, stats], i) => {
                    const isMe = address && player.toLowerCase() === address.toLowerCase();
                    return (
                      <div key={i} className={`grid grid-cols-4 px-5 py-3 items-center border-b border-outline-variant/[0.04] ${isMe ? "bg-primary/5" : "hover:bg-surface-container/30"}`}>
                        <span className={`w-7 h-7 rounded-full font-headline font-bold text-[10px] flex items-center justify-center ${i === 0 ? "bg-amber/10 text-amber" : "bg-surface-container-highest text-on-surface-variant/40"}`}>#{i + 1}</span>
                        <span className="font-headline text-xs text-on-surface font-mono">{isMe ? "YOU" : `${player.slice(0, 6)}…${player.slice(-4)}`}</span>
                        <span className="font-headline text-xs text-primary font-bold">{stats.biggestWin.toFixed(3)} STT</span>
                        <span className="font-headline text-xs text-secondary font-bold text-right">{stats.biggestMult.toFixed(2)}×</span>
                      </div>
                    );
                  });
              })()
            ) : (
              <div className="px-5 py-8 text-center text-on-surface-variant text-sm">No games played yet. Be the first!</div>
            )
          )}
        </div>

        {/* My Stats */}
        <div className="space-y-4">
          <div className="bg-surface-container-low p-5 border border-outline-variant/10">
            <h3 className="font-headline text-xs font-bold tracking-widest text-white uppercase mb-4">Your Stats</h3>
            {displayStats ? (
              <div className="space-y-3">
                <StatRow label="Total Won" value={displayStats.totalWon.toFixed(3) + " STT"} color="text-primary" />
                <StatRow label="Games Won" value={displayStats.gamesWon.toString()} color="text-secondary" />
                <StatRow label="Biggest Win" value={displayStats.biggestWin.toFixed(3) + " STT"} color="text-tertiary" />
                <StatRow label="Best Mult" value={displayStats.biggestMult.toFixed(2) + "×"} color="text-amber" />
                {"totalPnl" in displayStats && (
                  <StatRow label="Total PnL" value={((displayStats as any).totalPnl >= 0 ? "+" : "") + (displayStats as any).totalPnl.toFixed(3) + " STT"} color={(displayStats as any).totalPnl >= 0 ? "text-emerald" : "text-error"} />
                )}
                {"winRate" in displayStats && (
                  <StatRow label="Win Rate" value={(displayStats as any).winRate.toFixed(1) + "%"} color="text-secondary" />
                )}
              </div>
            ) : (
              <p className="text-sm text-on-surface-variant">
                {address ? "No games played yet." : "Connect wallet to see your stats."}
              </p>
            )}
          </div>

          <div className="bg-surface-container-low p-5 border border-outline-variant/10">
            <h3 className="font-headline text-xs font-bold tracking-widest text-white uppercase mb-2">Recent Games</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {gameHistory.slice(0, 8).map((g, i) => (
                <div key={i} className="flex justify-between items-center py-1.5 border-b border-outline-variant/[0.05]">
                  <span className="font-headline text-[10px] text-on-surface-variant">#{g.gameId}</span>
                  <span className={`font-headline text-[10px] font-bold ${g.won ? "text-primary" : "text-error"}`}>
                    {g.won ? `+${g.payout.toFixed(3)}` : `-${g.bet.toFixed(3)}`} STT
                  </span>
                </div>
              ))}
              {gameHistory.length === 0 && (
                <p className="text-[10px] text-on-surface-variant/50">No cached games yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-outline-variant/[0.05]">
      <span className="text-xs text-on-surface-variant/50">{label}</span>
      <span className={`text-xs font-bold ${color}`}>{value}</span>
    </div>
  );
}
