"use client";
import { createContext, useContext, useReducer, ReactNode, Dispatch } from "react";
import { GAME_CONFIG } from "@/lib/chain";
import { calcMultiplier, randomHex } from "@/lib/utils";

export type GameStatus = "idle" | "playing" | "won" | "lost";
export type TileState = "hidden" | "safe" | "mine";

export interface GameState {
  status: GameStatus;
  bet: number;
  mineCount: number;
  mines: Set<number>;
  revealed: Set<number>;
  multiplier: number;
  commitHash: string;
  sessionPnl: number;
  sessionGames: number;
}

type GameAction =
  | { type: "SET_BET"; bet: number }
  | { type: "SET_MINES"; count: number }
  | { type: "START_GAME" }
  | { type: "REVEAL_TILE"; index: number }
  | { type: "CASH_OUT" }
  | { type: "RESET" };

function generateMines(count: number): Set<number> {
  const mines = new Set<number>();
  while (mines.size < count) {
    mines.add(Math.floor(Math.random() * GAME_CONFIG.GRID_SIZE));
  }
  return mines;
}

const initialState: GameState = {
  status: "idle",
  bet: 100,
  mineCount: 5,
  mines: new Set(),
  revealed: new Set(),
  multiplier: 1,
  commitHash: "",
  sessionPnl: 0,
  sessionGames: 0,
};

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "SET_BET":
      return { ...state, bet: Math.max(1, action.bet) };
    case "SET_MINES":
      return { ...state, mineCount: action.count };
    case "START_GAME": {
      const mines = generateMines(state.mineCount);
      return {
        ...state,
        status: "playing",
        mines,
        revealed: new Set(),
        multiplier: 1,
        commitHash: "0x" + randomHex(64),
      };
    }
    case "REVEAL_TILE": {
      if (state.status !== "playing" || state.revealed.has(action.index)) return state;
      const newRevealed = new Set(state.revealed);
      newRevealed.add(action.index);

      if (state.mines.has(action.index)) {
        // Hit a mine — reveal all mines
        state.mines.forEach((m) => newRevealed.add(m));
        return {
          ...state,
          status: "lost",
          revealed: newRevealed,
          sessionPnl: state.sessionPnl - state.bet,
          sessionGames: state.sessionGames + 1,
        };
      }

      const safeCount = newRevealed.size;
      const newMult = calcMultiplier(safeCount, state.mineCount);
      const safeTilesNeeded = GAME_CONFIG.GRID_SIZE - state.mineCount;

      // Check if all safe tiles revealed
      if (safeCount >= safeTilesNeeded) {
        // Auto cashout on full clear
        for (let i = 0; i < GAME_CONFIG.GRID_SIZE; i++) newRevealed.add(i);
        const payout = Math.floor(state.bet * newMult);
        return {
          ...state,
          status: "won",
          revealed: newRevealed,
          multiplier: newMult,
          sessionPnl: state.sessionPnl + payout - state.bet,
          sessionGames: state.sessionGames + 1,
        };
      }

      return { ...state, revealed: newRevealed, multiplier: newMult };
    }
    case "CASH_OUT": {
      if (state.status !== "playing") return state;
      const newRevealed = new Set(state.revealed);
      for (let i = 0; i < GAME_CONFIG.GRID_SIZE; i++) newRevealed.add(i);
      const payout = Math.floor(state.bet * state.multiplier);
      return {
        ...state,
        status: "won",
        revealed: newRevealed,
        sessionPnl: state.sessionPnl + payout - state.bet,
        sessionGames: state.sessionGames + 1,
      };
    }
    case "RESET":
      return { ...state, status: "idle", mines: new Set(), revealed: new Set(), multiplier: 1, commitHash: "" };
    default:
      return state;
  }
}

const GameContext = createContext<{ state: GameState; dispatch: Dispatch<GameAction> } | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const value = { state, dispatch };
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}
