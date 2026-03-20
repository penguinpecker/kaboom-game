"use client";
import { useGame } from "@/hooks/useGame";
import { useModal } from "@/hooks/useModal";
import { useToast } from "@/hooks/useToast";
import { useAccount } from "wagmi";
import { GAME_CONFIG } from "@/lib/chain";
import { calcMultiplier, fullClearMultiplier, formatMult } from "@/lib/utils";

export function BetControls() {
  const { state, dispatch } = useGame();
  const { open } = useModal();
  const { toast } = useToast();
  const { isConnected } = useAccount();
  const isPlaying = state.status === "playing";
  const safeTiles = GAME_CONFIG.GRID_SIZE - state.mineCount;
  const progress = isPlaying ? Math.round((state.revealed.size / safeTiles) * 100) : 0;

  const handleStart = () => {
    if (!isConnected) { open("wallet"); return; }
    dispatch({ type: "START_GAME" });
    toast(`${state.mineCount} mines deployed`, "primary");
  };

  return (
    <div className="space-y-6">
      {/* ── Engagement Parameters ── */}
      <section className="bg-surface-container-low p-6 stealth-card border border-outline-variant/10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-headline text-xs font-bold tracking-widest text-white uppercase">Engagement Parameters</h2>
          <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 18 }}>tune</span>
        </div>

        <div className="space-y-4">
          {/* Bet Amount */}
          <div>
            <label className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant mb-2 block">
              Bet Amount (STT)
            </label>
            <div className="relative">
              <input
                type="text"
                value={state.bet}
                onChange={(e) => dispatch({ type: "SET_BET", bet: Number(e.target.value) || 0 })}
                disabled={isPlaying}
                className="w-full bg-surface-container-lowest border-none font-headline font-bold text-lg text-primary px-4 py-3 focus:ring-0 focus:outline-none disabled:opacity-50"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                <button
                  onClick={() => dispatch({ type: "SET_BET", bet: Math.floor(state.bet / 2) })}
                  disabled={isPlaying}
                  className="bg-surface-container-highest px-3 py-1 text-[10px] font-headline font-bold text-on-surface hover:bg-primary/20 transition-colors disabled:opacity-30"
                >1/2</button>
                <button
                  onClick={() => dispatch({ type: "SET_BET", bet: state.bet * 2 })}
                  disabled={isPlaying}
                  className="bg-surface-container-highest px-3 py-1 text-[10px] font-headline font-bold text-on-surface hover:bg-primary/20 transition-colors disabled:opacity-30"
                >2X</button>
              </div>
            </div>
          </div>

          {/* Mine Density */}
          <div>
            <label className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant mb-2 block">
              Mine Density
            </label>
            <div className="grid grid-cols-4 gap-2">
              {GAME_CONFIG.MINE_OPTIONS.map((n) => (
                <button
                  key={n}
                  onClick={() => dispatch({ type: "SET_MINES", count: n })}
                  disabled={isPlaying}
                  className={`bg-surface-container-highest py-2 font-headline font-bold text-xs transition-all disabled:opacity-30 ${
                    n === state.mineCount
                      ? "text-white border border-primary/40"
                      : "text-slate-400 hover:text-white"
                  }`}
                >{n}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Engage Bet / Cashout */}
        {!isPlaying ? (
          <button
            onClick={handleStart}
            className="w-full mt-8 py-5 bg-gradient-to-r from-primary to-primary-container text-on-primary font-headline font-black text-lg tracking-[0.2em] glow-primary hover:brightness-125 transition-all active:scale-95 flex items-center justify-center gap-3"
          >
            <span className="material-symbols-outlined mi" style={{ fontSize: 24 }}>bolt</span>
            ENGAGE BET
          </button>
        ) : (
          <button
            onClick={() => dispatch({ type: "CASH_OUT" })}
            className="w-full mt-8 py-5 border-2 border-emerald text-emerald font-headline font-black text-lg tracking-[0.15em] hover:bg-emerald/10 transition-all active:scale-95 animate-cash-pulse flex items-center justify-center gap-3"
          >
            <span className="material-symbols-outlined mi" style={{ fontSize: 24 }}>savings</span>
            CASH OUT — {Math.floor(state.bet * state.multiplier)} STT
          </button>
        )}
      </section>

      {/* ── Progress ── */}
      {isPlaying && (
        <section className="bg-surface-container-low p-4 border border-outline-variant/10 animate-fade-up">
          <div className="flex justify-between mb-2">
            <span className="font-headline text-[10px] text-on-surface-variant tracking-widest uppercase">Clear Progress</span>
            <span className="font-headline text-sm text-primary font-bold">{progress}%</span>
          </div>
          <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-primary-container rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </section>
      )}

      {/* ── Commitment Hash ── */}
      {isPlaying && (
        <section className="bg-surface-container-low p-4 border border-outline-variant/10 animate-fade-up">
          <div className="flex items-center gap-2 mb-2">
            <span className="material-symbols-outlined text-emerald mi" style={{ fontSize: 16 }}>lock</span>
            <span className="font-headline text-[10px] font-bold tracking-widest text-emerald uppercase">Commitment Hash</span>
          </div>
          <div className="font-mono text-[10px] text-primary/60 break-all select-all">{state.commitHash}</div>
        </section>
      )}
    </div>
  );
}
