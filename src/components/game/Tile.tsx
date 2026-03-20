"use client";
import { useGame } from "@/hooks/useGame";
import { GemIcon, MineIcon } from "@/components/ui/Icons";

export function Tile({ index }: { index: number }) {
  const { state, dispatch } = useGame();
  const isRevealed = state.revealed.has(index);
  const isMine = state.mines.has(index);
  const isPlaying = state.status === "playing";
  const isLost = state.status === "lost";

  // Revealed MINE
  if (isRevealed && isMine) {
    return (
      <div className="bg-tertiary-container/20 stealth-card border border-tertiary flex flex-col items-center justify-center boom-glow animate-tile-reveal">
        <span className="material-symbols-outlined text-tertiary mi" style={{ fontSize: 48 }}>emergency</span>
        <span className="font-headline text-[10px] font-black text-tertiary uppercase">BOOM</span>
      </div>
    );
  }

  // Revealed SAFE
  if (isRevealed && !isMine) {
    return (
      <div className="bg-primary-container/20 stealth-card border border-primary/60 flex flex-col items-center justify-center gem-glow animate-pop-in">
        <span className="material-symbols-outlined text-primary mi" style={{ fontSize: 48 }}>verified</span>
        <span className="font-headline text-[10px] font-bold text-primary uppercase">SAFE</span>
      </div>
    );
  }

  // Unrevealed mine shown faded after loss
  if (isLost && isMine) {
    return (
      <div className="bg-tertiary-container/10 stealth-card border border-tertiary/20 flex flex-col items-center justify-center opacity-40">
        <span className="material-symbols-outlined text-tertiary" style={{ fontSize: 36 }}>emergency</span>
      </div>
    );
  }

  // Hidden clickable tile
  if (isPlaying) {
    return (
      <div
        onClick={() => dispatch({ type: "REVEAL_TILE", index })}
        className="bg-surface-container-highest stealth-card group cursor-pointer hover:bg-primary/10 transition-all border border-primary/5 relative flex items-center justify-center"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <span className="material-symbols-outlined text-primary/20 group-hover:scale-110 transition-transform" style={{ fontSize: 40 }}>view_in_ar</span>
      </div>
    );
  }

  // Idle state - not playing
  return (
    <div className="bg-surface-container-highest stealth-card border border-primary/5 flex items-center justify-center">
      <span className="material-symbols-outlined text-primary/20" style={{ fontSize: 40 }}>view_in_ar</span>
    </div>
  );
}
