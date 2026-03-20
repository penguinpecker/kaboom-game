"use client";
import { useGame } from "@/hooks/useGame";
import { useModal } from "@/hooks/useModal";
import { Tile } from "./Tile";
import { formatMult, nextTileMultiplier } from "@/lib/utils";
import { GAME_CONFIG } from "@/lib/chain";
import { useEffect } from "react";

export function Grid() {
  const { state, dispatch } = useGame();
  const { open } = useModal();
  const safeTiles = GAME_CONFIG.GRID_SIZE - state.mineCount;
  const nextMult = nextTileMultiplier(state.revealed.size, state.mineCount);
  const riskLevel = state.revealed.size / safeTiles;
  const riskText = riskLevel > 0.6 ? "CRITICAL" : riskLevel > 0.3 ? "HIGH" : riskLevel > 0 ? "MODERATE" : "STANDBY";
  const riskColor = riskLevel > 0.6 ? "text-error" : riskLevel > 0.3 ? "text-amber" : "text-emerald";

  useEffect(() => {
    if (state.status === "won") {
      const t = setTimeout(() => open("win"), 400);
      return () => clearTimeout(t);
    }
    if (state.status === "lost") {
      const t = setTimeout(() => open("lose"), 500);
      return () => clearTimeout(t);
    }
  }, [state.status, open]);

  return (
    <div className="bg-surface-container-low p-8 stealth-card border border-outline-variant/10 aspect-square lg:aspect-video flex flex-col">
      {/* Header tags */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2">
          <span className="px-3 py-1 bg-surface-container-highest text-[10px] font-headline font-bold text-primary tracking-widest">
            GRID: 4X4
          </span>
          <span className="px-3 py-1 bg-surface-container-highest text-[10px] font-headline font-bold text-tertiary tracking-widest">
            MULTIPLIER: {formatMult(state.multiplier)}
          </span>
        </div>
        <div className="flex items-center gap-2 font-headline text-[10px] tracking-widest text-on-surface-variant uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse" />
          Live Telemetry Stream
        </div>
      </div>

      {/* 4x4 Grid */}
      <div className="flex-1 grid grid-cols-4 grid-rows-4 gap-4">
        {Array.from({ length: GAME_CONFIG.GRID_SIZE }, (_, i) => (
          <Tile key={i} index={i} />
        ))}
      </div>

      {/* Footer bar - matches original: Next Step Gain | Risk Level | Exit & Withdraw */}
      <div className="mt-8 flex justify-between items-center bg-surface-container-lowest/50 p-4 border-l-4 border-primary">
        <div className="flex items-center gap-4">
          <div>
            <div className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant">Next Step Gain</div>
            <div className="font-headline font-bold text-primary text-lg">
              {state.status === "playing" ? formatMult(nextMult) : "—"}
            </div>
          </div>
          <div className="h-8 w-px bg-outline-variant/20" />
          <div>
            <div className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant">Risk Level</div>
            <div className={`font-headline font-bold text-lg ${riskColor}`}>{riskText}</div>
          </div>
        </div>
        {state.status === "playing" ? (
          <button
            onClick={() => dispatch({ type: "CASH_OUT" })}
            className="py-3 px-8 bg-surface-bright border border-primary/30 text-primary font-headline font-black text-xs tracking-widest hover:bg-primary hover:text-on-primary transition-all"
          >
            EXIT &amp; WITHDRAW
          </button>
        ) : (
          <button
            onClick={() => open("fair")}
            className="py-3 px-8 bg-surface-bright border border-primary/30 text-primary font-headline font-black text-xs tracking-widest hover:bg-primary hover:text-on-primary transition-all"
          >
            VERIFY FAIR
          </button>
        )}
      </div>
    </div>
  );
}
