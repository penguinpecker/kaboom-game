"use client";
import { useLeaderboard, usePlayerStats, useGameCounter } from "@/hooks/useContracts";
import { useAccount } from "wagmi";
import { formatEther } from "viem";

export default function LeaderboardPage() {
  const { address } = useAccount();
  const { data: leaders } = useLeaderboard();
  const { data: myStats } = usePlayerStats(address);
  const { data: gameCount } = useGameCounter();

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
          Total Games: <span className="text-secondary font-bold">{gameCount ? gameCount.toString() : "—"}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        {/* Rankings Table */}
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
          {leaders ? (
            ([...leaders] as any[]).map((entry: any, i: number) => {
              if (entry.player === "0x0000000000000000000000000000000000000000") return null;
              return (
                <div key={i} className="grid grid-cols-4 px-5 py-3 items-center hover:bg-surface-container/30 border-b border-outline-variant/[0.04]">
                  <span className={`w-7 h-7 rounded-full font-headline font-bold text-[10px] flex items-center justify-center ${i === 0 ? "bg-amber/10 text-amber" : i < 3 ? "bg-on-surface-variant/[0.06] text-on-surface-variant/60" : "bg-surface-container-highest text-on-surface-variant/40"}`}>
                    #{i + 1}
                  </span>
                  <span className="font-headline text-xs text-on-surface font-mono">
                    {entry.player.slice(0, 6)}…{entry.player.slice(-4)}
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
            <div className="px-5 py-8 text-center text-on-surface-variant text-sm">
              No games played yet. Be the first!
            </div>
          )}
          {leaders && !([...leaders] as any[]).some((e: any) => e.player !== "0x0000000000000000000000000000000000000000") && (
            <div className="px-5 py-8 text-center text-on-surface-variant text-sm">
              No winners yet. Start playing to appear here!
            </div>
          )}
        </div>

        {/* My Stats */}
        <div className="space-y-4">
          <div className="bg-surface-container-low p-5 border border-outline-variant/10">
            <h3 className="font-headline text-xs font-bold tracking-widest text-white uppercase mb-4">Your Stats</h3>
            {address && myStats ? (
              <div className="space-y-3">
                <StatRow label="Total Won" value={Number(formatEther((myStats as any).totalWon)).toFixed(3) + " STT"} color="text-primary" />
                <StatRow label="Games Won" value={(myStats as any).gamesWon.toString()} color="text-secondary" />
                <StatRow label="Biggest Win" value={Number(formatEther((myStats as any).biggestWin)).toFixed(3) + " STT"} color="text-tertiary" />
                <StatRow label="Best Mult" value={(Number((myStats as any).biggestMultiplier) / 1e18).toFixed(2) + "×"} color="text-amber" />
              </div>
            ) : (
              <p className="text-sm text-on-surface-variant">
                {address ? "No games played yet." : "Connect wallet to see your stats."}
              </p>
            )}
          </div>

          <div className="bg-gradient-to-br from-secondary-container/20 to-surface-container-high p-5 border border-secondary/10">
            <h3 className="font-headline text-base font-black italic text-on-surface mb-1">REACTIVE RANKING</h3>
            <p className="text-xs text-on-surface-variant mb-3">
              Leaderboard updates automatically via Somnia Reactivity when GameWon events fire. No backend needed.
            </p>
            <a href={`https://shannon-explorer.somnia.network/address/${CONTRACTS_ADDR}`} target="_blank" rel="noreferrer"
              className="font-headline text-[10px] text-primary hover:underline">View contract on explorer →</a>
          </div>
        </div>
      </div>
    </div>
  );
}

const CONTRACTS_ADDR = "0x82F67Bec332c7A49D73C8078bdD72A4E381968fd";

function StatRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-outline-variant/[0.05]">
      <span className="text-xs text-on-surface-variant/50">{label}</span>
      <span className={`text-xs font-bold ${color}`}>{value}</span>
    </div>
  );
}
