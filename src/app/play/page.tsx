"use client";
import { Grid } from "@/components/game/Grid";
import { BetControls } from "@/components/game/BetControls";
import { useGame } from "@/hooks/useGame";
import { randomName, randomBet, calcMultiplier, fullClearMultiplier, formatMult } from "@/lib/utils";
import { GAME_CONFIG } from "@/lib/chain";
import { useEffect, useState } from "react";

export default function PlayPage() {
  const { state } = useGame();

  return (
    <div className="px-6 lg:px-8 pb-16 min-h-screen kinetic-grid">
      {/* ── Dashboard Header ── */}
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="font-headline text-4xl font-black italic tracking-tighter uppercase text-white mb-2">
            Tactical Grid <span className="text-primary-container">v2.4</span>
          </h1>
          <p className="font-headline text-xs tracking-[0.3em] text-on-surface-variant flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-tertiary-container animate-pulse" />
            SYSTEM_ACTIVE // SECTOR_KABOOM
          </p>
        </div>
        <div className="hidden lg:flex gap-4">
          <div className="bg-surface-container-high p-4 stealth-card border-l-2 border-primary">
            <div className="font-headline text-[10px] tracking-widest text-on-surface-variant uppercase mb-1">Session PnL</div>
            <div className={`font-headline text-2xl font-bold ${state.sessionPnl >= 0 ? "text-primary" : "text-error"}`}>
              {state.sessionPnl >= 0 ? "+" : ""}{state.sessionPnl} STT
            </div>
          </div>
          <div className="bg-surface-container-high p-4 stealth-card border-l-2 border-tertiary">
            <div className="font-headline text-[10px] tracking-widest text-on-surface-variant uppercase mb-1">Win Probability</div>
            <div className="font-headline text-2xl font-bold text-tertiary">68.4%</div>
          </div>
        </div>
      </div>

      {/* ── 12-Column Grid Layout ── */}
      <div className="grid grid-cols-12 gap-8">
        {/* Left Panel */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <BetControls />
          <SignalIntel />
        </div>

        {/* Right Panel */}
        <div className="col-span-12 lg:col-span-8">
          <Grid />
        </div>
      </div>

      {/* ── Payout Multiplier Table ── */}
      <div className="mt-10">
        <h2 className="font-headline text-xl font-black italic tracking-tight text-white mb-6 border-l-4 border-secondary pl-4">
          PAYOUT MULTIPLIERS
        </h2>
        <PayoutTable mineCount={state.mineCount} bet={state.bet} />
      </div>
    </div>
  );
}

function PayoutTable({ mineCount, bet }: { mineCount: number; bet: number }) {
  const safeTiles = GAME_CONFIG.GRID_SIZE - mineCount;
  const rows = [];
  for (let i = 1; i <= Math.min(safeTiles, 10); i++) {
    const mult = calcMultiplier(i, mineCount);
    const payout = Math.floor(bet * mult);
    rows.push({ tiles: i, mult, payout });
  }

  return (
    <div className="bg-surface-container-low border border-outline-variant/10 overflow-hidden">
      <div className="grid grid-cols-4 px-6 py-3 border-b border-outline-variant/10">
        <span className="font-headline text-[10px] tracking-widest text-on-surface-variant uppercase">Tiles Cleared</span>
        <span className="font-headline text-[10px] tracking-widest text-on-surface-variant uppercase">Multiplier</span>
        <span className="font-headline text-[10px] tracking-widest text-on-surface-variant uppercase">Payout</span>
        <span className="font-headline text-[10px] tracking-widest text-on-surface-variant uppercase text-right">Probability</span>
      </div>
      {rows.map((r, i) => {
        // Calculate probability of clearing exactly i tiles
        let prob = 1;
        for (let j = 0; j < r.tiles; j++) {
          prob *= (GAME_CONFIG.GRID_SIZE - mineCount - j) / (GAME_CONFIG.GRID_SIZE - j);
        }
        return (
          <div key={r.tiles} className="grid grid-cols-4 px-6 py-3 border-b border-outline-variant/[0.05] hover:bg-surface-container/30 transition-colors">
            <span className="font-headline text-sm text-on-surface">{r.tiles} / {safeTiles}</span>
            <span className="font-headline text-sm text-secondary font-bold">{formatMult(r.mult)}</span>
            <span className="font-headline text-sm text-primary font-bold">+{r.payout} STT</span>
            <span className="font-headline text-sm text-on-surface-variant text-right">{(prob * 100).toFixed(1)}%</span>
          </div>
        );
      })}
      <div className="grid grid-cols-4 px-6 py-3 bg-surface-container-lowest/30">
        <span className="font-headline text-sm text-tertiary font-bold">Full Clear ({safeTiles})</span>
        <span className="font-headline text-sm text-tertiary font-bold">{formatMult(fullClearMultiplier(mineCount))}</span>
        <span className="font-headline text-sm text-tertiary font-bold">+{Math.floor(bet * fullClearMultiplier(mineCount))} STT</span>
        <span className="font-headline text-sm text-tertiary text-right">
          {(() => {
            let p = 1;
            for (let j = 0; j < safeTiles; j++) p *= (GAME_CONFIG.GRID_SIZE - mineCount - j) / (GAME_CONFIG.GRID_SIZE - j);
            return (p * 100).toFixed(2) + "%";
          })()}
        </span>
      </div>
    </div>
  );
}

function SignalIntel() {
  const [items, setItems] = useState<Array<{ id: string; name: string; result: string; win: boolean }>>([]);

  useEffect(() => {
    setItems(
      Array.from({ length: 5 }, (_, i) => {
        const w = Math.random() > 0.3;
        const b = randomBet();
        const r = w ? Math.floor(b * (Math.random() * 5 + 1)) : b;
        return { id: `#${8941 - i}`, name: randomName(), result: w ? `+${r} STT` : `-${r} STT`, win: w };
      })
    );
  }, []);

  return (
    <section className="bg-surface-container-low p-6 stealth-card border border-outline-variant/10">
      <h2 className="font-headline text-xs font-bold tracking-widest text-white uppercase mb-4">Signal Intel</h2>
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {items.map((it, i) => (
          <div key={i} className="flex justify-between items-center py-2 border-b border-outline-variant/10">
            <span className="font-headline text-[10px] text-slate-400">{it.id} {it.name}</span>
            <span className={`font-headline text-[10px] ${it.win ? "text-primary" : "text-error"}`}>{it.result}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
