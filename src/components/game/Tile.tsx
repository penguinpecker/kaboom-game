"use client";
import { useGame } from "@/hooks/useGame";

export function Tile({ index }: { index: number }) {
  const { state, revealTile } = useGame();
  const isSafe = state.safeTiles.has(index);
  const isMine = state.mineTiles.has(index);
  const isRevealed = state.revealedTiles.has(index);
  const isPending = state.pendingTile === index;
  const isPlaying = state.status === "playing";
  const isGameOver = state.status === "won" || state.status === "lost";

  // Revealed SAFE
  if (isSafe) {
    return (
      <div className="bg-primary-container/20 stealth-card border border-primary/60 flex flex-col items-center justify-center gem-glow">
        <span className="material-symbols-outlined text-primary mi" style={{ fontSize: 48 }}>verified</span>
        <span className="font-headline text-[10px] font-bold text-primary uppercase">SAFE</span>
      </div>
    );
  }

  // Revealed MINE
  if (isMine) {
    return (
      <div className="bg-tertiary-container/20 stealth-card border border-tertiary flex flex-col items-center justify-center boom-glow">
        <span className="material-symbols-outlined text-tertiary mi" style={{ fontSize: 48 }}>emergency</span>
        <span className="font-headline text-[10px] font-black text-tertiary uppercase">BOOM</span>
      </div>
    );
  }

  // Pending transaction
  if (isPending) {
    return (
      <div className="bg-surface-container-highest stealth-card border border-primary/30 flex items-center justify-center animate-pulse">
        <span className="material-symbols-outlined text-primary animate-spin" style={{ fontSize: 32 }}>progress_activity</span>
      </div>
    );
  }

  // Clickable tile (active game)
  if (isPlaying && !isGameOver) {
    return (
      <div
        onClick={() => revealTile(index)}
        className="bg-surface-container-highest stealth-card group cursor-pointer hover:bg-primary/10 transition-all border border-primary/5 relative flex items-center justify-center"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <span className="material-symbols-outlined text-primary/20 group-hover:text-primary/50 group-hover:scale-110 transition-all" style={{ fontSize: 40 }}>view_in_ar</span>
      </div>
    );
  }

  // Idle / game over unrevealed
  return (
    <div className="bg-surface-container-highest stealth-card border border-primary/5 flex items-center justify-center">
      <span className="material-symbols-outlined text-primary/15" style={{ fontSize: 40 }}>view_in_ar</span>
    </div>
  );
}
