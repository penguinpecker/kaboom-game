"use client";
import { useLeaderboard, usePlayerStats, useGameCounter } from "@/hooks/useContracts";
import { useGameHistory } from "@/hooks/useGameHistory";
import { useAccount } from "wagmi";
import { formatEther } from "viem";
import { useMemo } from "react";

export default function LeaderboardPage() {
  const { address } = useAccount();
  const { data: leaders } = useLeaderboard();
  const { data: gameCount } = useGameCounter();
  const { history } = useGameHistory();

  // Build stats from localStorage
  const localStats = useMemo(() => {
    if (!history.length) return null;
    const myGames = address ? history.filter(g => g.player.toLowerCase() === address.toLowerCase()) : history;
    if (!myGames.length) return null;
    const wins = myGames.filter(g => g.won);
    const losses = myGames.filter(g => !g.won);
    return {
      totalWon: wins.reduce((s, g) => s + g.payout, 0),
      gamesWon: wins.length,
      gamesPlayed: myGames.length,
      biggestWin: wins.length > 0 ? Math.max(...wins.map(g => g.payout)) : 0,
      biggestMult: wins.length > 0 ? Math.max(...wins.map(g => g.multiplier)) : 0,
      totalPnl: wins.reduce((s, g) => s + g.payout - g.bet, 0) - losses.reduce((s, g) => s + g.bet, 0),
      winRate: myGames.length > 0 ? (wins.length / myGames.length * 100) : 0,
    };
  }, [address, history]);

  // Build local leaderboard from all cached games
  const localLeaders = useMemo(() => {
    if (!history.length) return [];
    const playerMap = new Map<string, { totalWon: number; biggestWin: number; biggestMult: number; games: number }>();
    history.forEach(g => {
      const key = g.player.toLowerCase();
      const existing = playerMap.get(key) || { totalWon: 0, biggestWin: 0, biggestMult: 0, games: 0 };
      existing.games++;
      if (g.won) {
        existing.totalWon += g.payout;
        if (g.payout > existing.biggestWin) existing.biggestWin = g.payout;
        if (g.multiplier > existing.biggestMult) existing.biggestMult = g.multiplier;
      }
      playerMap.set(key, existing);
    });
    return Array.from(playerMap.entries())
      .filter(([, s]) => s.biggestWin > 0)
      .sort((a, b) => b[1].totalWon - a[1].totalWon)
      .slice(0, 10);
  }, [history]);

  // Check if on-chain leaderboard has real data
  const hasChainLeaders = leaders && ([...leaders] as any[]).some((e: any) => e.player !== "0x0000000000000000000000000000000000000000");

  return (
    <div className="px-6 lg:px-8 pb-16 min-h-screen">
      <div className="flex justify-between items-end mb-8">
        <div>
          <p className="font-headline text-[10px] tracking-[.12em] text-on-surface-variant flex items-center gap-1 mb-0.5">
            <span className="status-dot" />LIVE RANKINGS
          </p>
          <h1 className="font-headline text-3xl font-black italic tracking-tighter text-on-surface">
            GLOBAL <span className="text-primary">LEADERBOARD</span>
          </h1>
        </div>
        <div className="font-headline text-sm text-on-surface-variant">
          Games: <span className="text-secondary font-bold">{gameCount ? gameCount.toString() : history.length.toString()}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        {/* Rankings */}
        <div className="bg-surface-container-low border border-outline-variant/10 stealth-card">
          <div className="px-5 py-3 border-b border-outline-variant/10">
            <h2 className="font-headline text-xs font-bold tracking-widest text-white uppercase flex items-center gap-1.5">
              <span className="material-symbols-outlined text-amber mi" style={{ fontSize: 18 }}>emoji_events</span>
              Rankings {hasChainLeaders ? "(On-Chain)" : "(Local Cache)"}
            </h2>
          </div>
          <div className="grid grid-cols-4 px-5 py-2 border-b border-outline-variant/10">
            <span className="font-headline text-[10px] tracking-widest text-on-surface-variant/40 uppercase">Rank</span>
            <span className="font-headline text-[10px] tracking-widest text-on-surface-variant/40 uppercase">Player</span>
            <span className="font-headline text-[10px] tracking-widest text-on-surface-variant/40 uppercase">Total Won</span>
            <span className="font-headline text-[10px] tracking-widest text-on-surface-variant/40 uppercase text-right">Best Mult</span>
          </div>

          {hasChainLeaders ? (
            ([...leaders!] as any[]).map((entry: any, i: number) => {
              if (entry.player === "0x0000000000000000000000000000000000000000") return null;
              const isMe = address && entry.player.toLowerCase() === address.toLowerCase();
              return (
                <div key={i} className={`grid grid-cols-4 px-5 py-3 items-center border-b border-outline-variant/[0.04] ${isMe ? "bg-primary/5" : "hover:bg-surface-container/30"}`}>
                  <RankBadge rank={i + 1} />
                  <span className="font-headline text-xs text-on-surface font-mono">{isMe ? "YOU" : `${entry.player.slice(0, 6)}…${entry.player.slice(-4)}`}</span>
                  <span className="font-headline text-xs text-primary font-bold">{Number(formatEther(entry.biggestWin)).toFixed(3)} STT</span>
                  <span className="font-headline text-xs text-secondary font-bold text-right">{(Number(entry.biggestMultiplier) / 1e18).toFixed(2)}×</span>
                </div>
              );
            })
          ) : localLeaders.length > 0 ? (
            localLeaders.map(([player, stats], i) => {
              const isMe = address && player.toLowerCase() === address.toLowerCase();
              return (
                <div key={i} className={`grid grid-cols-4 px-5 py-3 items-center border-b border-outline-variant/[0.04] ${isMe ? "bg-primary/5" : "hover:bg-surface-container/30"}`}>
                  <RankBadge rank={i + 1} />
                  <span className="font-headline text-xs text-on-surface font-mono">{isMe ? "YOU" : `${player.slice(0, 6)}…${player.slice(-4)}`}</span>
                  <span className="font-headline text-xs text-primary font-bold">{stats.totalWon.toFixed(3)} STT</span>
                  <span className="font-headline text-xs text-secondary font-bold text-right">{stats.biggestMult.toFixed(2)}×</span>
                </div>
              );
            })
          ) : (
            <div className="px-5 py-8 text-center text-on-surface-variant text-sm">No games played yet. Play to appear here!</div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* My Stats */}
          <div className="bg-surface-container-low p-5 border border-outline-variant/10">
            <h3 className="font-headline text-xs font-bold tracking-widest text-white uppercase mb-4">Your Stats</h3>
            {localStats ? (
              <div className="space-y-3">
                <StatRow label="Games Played" value={localStats.gamesPlayed.toString()} color="text-on-surface" />
                <StatRow label="Games Won" value={localStats.gamesWon.toString()} color="text-secondary" />
                <StatRow label="Win Rate" value={localStats.winRate.toFixed(1) + "%"} color="text-secondary" />
                <StatRow label="Total Won" value={localStats.totalWon.toFixed(3) + " STT"} color="text-primary" />
                <StatRow label="Biggest Win" value={localStats.biggestWin.toFixed(3) + " STT"} color="text-tertiary" />
                <StatRow label="Best Mult" value={localStats.biggestMult.toFixed(2) + "×"} color="text-amber" />
                <StatRow label="Total PnL" value={(localStats.totalPnl >= 0 ? "+" : "") + localStats.totalPnl.toFixed(3) + " STT"} color={localStats.totalPnl >= 0 ? "text-emerald" : "text-error"} />
              </div>
            ) : (
              <p className="text-sm text-on-surface-variant">{address ? "No games yet." : "Connect wallet to see stats."}</p>
            )}
          </div>

          {/* Recent Games */}
          <div className="bg-surface-container-low p-5 border border-outline-variant/10">
            <h3 className="font-headline text-xs font-bold tracking-widest text-white uppercase mb-3">Recent Games</h3>
            <div className="space-y-1.5 max-h-52 overflow-y-auto">
              {history.slice(0, 10).map((g, i) => (
                <div key={`${g.gameId}-${g.timestamp}`} className="flex justify-between items-center py-1.5 border-b border-outline-variant/[0.05]">
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${g.won ? "bg-emerald" : "bg-error"}`} />
                    <span className="font-headline text-[10px] text-on-surface-variant">#{g.gameId}</span>
                  </div>
                  <span className={`font-headline text-[10px] font-bold ${g.won ? "text-primary" : "text-error"}`}>
                    {g.won ? `+${g.payout.toFixed(3)}` : `-${g.bet.toFixed(3)}`} STT
                  </span>
                </div>
              ))}
              {history.length === 0 && <p className="text-[10px] text-on-surface-variant/50">Play a game to see history</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const cls = rank === 1 ? "bg-amber/10 text-amber" : rank <= 3 ? "bg-on-surface-variant/[0.06] text-on-surface-variant/60" : "bg-surface-container-highest text-on-surface-variant/40";
  return <span className={`w-7 h-7 rounded-full font-headline font-bold text-[10px] flex items-center justify-center ${cls}`}>#{rank}</span>;
}

function StatRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-outline-variant/[0.05]">
      <span className="text-xs text-on-surface-variant/50">{label}</span>
      <span className={`text-xs font-bold ${color}`}>{value}</span>
    </div>
  );
}
