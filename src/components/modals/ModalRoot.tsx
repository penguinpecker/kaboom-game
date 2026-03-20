"use client";
import { useModal } from "@/hooks/useModal";
import { useToast } from "@/hooks/useToast";
import { useGame } from "@/hooks/useGame";
import { useAccount, useConnect, useDisconnect, useBalance } from "wagmi";
import { useReferralStats, useVerifyGame } from "@/hooks/useContracts";
import { ModalShell } from "./ModalShell";
import { formatEther } from "viem";
import { useState } from "react";

export function ModalRoot() {
  const { modal } = useModal();
  if (!modal) return null;
  switch (modal) {
    case "wallet": return <WalletModal />;
    case "profile": return <ProfileModal />;
    case "deposit": return <DepositModal />;
    case "fair": return <FairModal />;
    case "referral": return <ReferralModal />;
    case "settings": return <SettingsModal />;
    case "win": return <WinModal />;
    case "lose": return <LoseModal />;
    default: return null;
  }
}

function WalletModal() {
  const { close } = useModal();
  const { toast } = useToast();
  const { connect, connectors } = useConnect();

  return (
    <ModalShell title="Connect Wallet">
      <p className="text-xs text-on-surface-variant mb-3">Somnia Testnet (Chain 50312)</p>
      {connectors.map((c) => (
        <button key={c.id} onClick={() => { connect({ connector: c }); toast("Connecting...", "primary"); close(); }}
          className="w-full flex items-center gap-3 px-3 py-3 bg-surface-container-highest border border-outline-variant/10 hover:border-primary/25 hover:bg-primary/5 transition-all mb-2 group">
          <div className="w-8 h-8 rounded bg-surface-bright flex items-center justify-center">
            <span className="material-symbols-outlined text-primary mi" style={{ fontSize: 20 }}>account_balance_wallet</span>
          </div>
          <div className="flex-1 text-left">
            <div className="font-headline text-xs font-bold text-on-surface group-hover:text-primary">{c.name}</div>
          </div>
          <span className="material-symbols-outlined text-on-surface-variant/30 text-sm group-hover:text-primary">arrow_forward</span>
        </button>
      ))}
    </ModalShell>
  );
}

function ProfileModal() {
  const { open, close } = useModal();
  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  const { toast } = useToast();
  const { data: balData } = useBalance({ address });
  const short = address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "";
  const bal = balData ? Number(formatEther(balData.value)).toFixed(3) : "—";

  return (
    <ModalShell title="Wallet">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/25 to-tertiary-container/15 flex items-center justify-center">
          <span className="material-symbols-outlined text-primary mi">person</span>
        </div>
        <div>
          <div className="font-headline text-sm font-bold text-primary">{short}</div>
          <div className="font-headline text-[10px] text-on-surface-variant/50">Somnia Testnet • Connected</div>
        </div>
      </div>
      <div className="bg-surface-container-lowest p-3 mb-3 flex justify-between items-center">
        <span className="font-headline text-[10px] text-on-surface-variant tracking-widest uppercase">Balance</span>
        <span className="font-headline text-xl font-bold text-primary">{bal} STT</span>
      </div>
      <div className="flex gap-2">
        <button onClick={() => { close(); setTimeout(() => open("deposit"), 100); }}
          className="flex-1 py-2.5 bg-gradient-to-r from-primary to-primary-container text-on-primary font-headline font-bold text-[10px] tracking-widest hover:brightness-110">DEPOSIT</button>
        <button onClick={() => { disconnect(); toast("Disconnected", "amber"); close(); }}
          className="py-2.5 px-4 border border-error/15 text-error/60 font-headline font-bold text-[10px] tracking-widest hover:bg-error/5">DISCONNECT</button>
      </div>
    </ModalShell>
  );
}

function DepositModal() {
  const { close } = useModal();
  const { toast } = useToast();
  const [amt, setAmt] = useState("1");
  return (
    <ModalShell title="Deposit STT">
      <p className="text-xs text-on-surface-variant mb-3">Send STT to vault to increase bankroll</p>
      <input type="number" value={amt} onChange={(e) => setAmt(e.target.value)}
        className="w-full bg-surface-container-lowest font-headline font-bold text-xl text-primary px-3 py-2 mb-3 outline-none" />
      <button onClick={() => { toast("Use the Vault page to deposit", "primary"); close(); }}
        className="w-full py-3 bg-gradient-to-r from-primary to-primary-container text-on-primary font-headline font-black text-xs tracking-widest">DEPOSIT</button>
    </ModalShell>
  );
}

function FairModal() {
  const { state } = useGame();
  const { data: verifyData } = useVerifyGame(state.gameId || undefined);

  const verified = verifyData ? (verifyData as any)[0] : null;
  const commitment = state.commitment || "Play a game to see commitment";
  const mineLayout = verifyData ? (verifyData as any)[2]?.toString() : "Hidden until game ends";
  const salt = verifyData ? (verifyData as any)[3] : "Hidden until game ends";

  return (
    <ModalShell title="Provably Fair">
      <p className="text-xs text-on-surface-variant mb-3">Commit-reveal scheme. Mine layout hashed before game, revealed after.</p>
      <div className="space-y-3">
        <div>
          <div className="font-headline text-[10px] text-on-surface-variant/40 tracking-widest uppercase mb-0.5">Commitment</div>
          <div className="bg-surface-container-lowest p-2 font-mono text-[9px] text-primary break-all select-all">{commitment}</div>
        </div>
        <div>
          <div className="font-headline text-[10px] text-on-surface-variant/40 tracking-widest uppercase mb-0.5">Mine Layout</div>
          <div className="bg-surface-container-lowest p-2 font-mono text-[9px] text-tertiary break-all select-all">{mineLayout}</div>
        </div>
        <div>
          <div className="font-headline text-[10px] text-on-surface-variant/40 tracking-widest uppercase mb-0.5">Salt</div>
          <div className="bg-surface-container-lowest p-2 font-mono text-[9px] text-secondary break-all select-all">{salt}</div>
        </div>
        {verified !== null && (
          <div className={`${verified ? "bg-emerald/5 border-emerald/15" : "bg-error/5 border-error/15"} border p-3 flex items-center gap-2.5`}>
            <span className={`material-symbols-outlined mi ${verified ? "text-emerald" : "text-error"}`} style={{ fontSize: 20 }}>
              {verified ? "check_circle" : "error"}
            </span>
            <div>
              <div className={`font-headline text-xs font-bold ${verified ? "text-emerald" : "text-error"}`}>
                {verified ? "Verification Passed" : "Verification Failed"}
              </div>
              <div className="text-[10px] text-on-surface-variant">keccak256(layout + salt) == commitment</div>
            </div>
          </div>
        )}
      </div>
    </ModalShell>
  );
}

function ReferralModal() {
  const { toast } = useToast();
  const { address } = useAccount();
  const { data: refStats } = useReferralStats(address);
  const link = address ? `https://kaboom.gg/?ref=${address}` : "Connect wallet";
  const earned = refStats ? Number(formatEther((refStats as any).totalEarned)).toFixed(3) : "0";
  const count = refStats ? (refStats as any).referralCount.toString() : "0";

  return (
    <ModalShell title="Referral Program">
      <div className="bg-gradient-to-br from-secondary-container/15 to-surface-container p-3 border border-secondary/15 mb-3">
        <div className="font-headline text-xl font-bold text-secondary">Earn 1% of every bet</div>
        <p className="text-xs text-on-surface-variant mt-1">Auto-credited via ReactiveReferral contract.</p>
      </div>
      <div className="flex mb-3">
        <input className="flex-1 bg-surface-container-lowest font-mono text-[9px] text-primary px-2.5 py-2 outline-none" value={link} readOnly />
        <button onClick={() => { navigator.clipboard?.writeText(link); toast("Copied!", "emerald"); }}
          className="px-3 bg-primary/15 text-primary font-headline text-[10px] font-bold tracking-widest hover:bg-primary/25">COPY</button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-surface-container-lowest p-3 text-center">
          <div className="font-headline text-lg font-bold text-primary">{count}</div>
          <div className="font-headline text-[10px] text-on-surface-variant/40 tracking-widest">REFERRED</div>
        </div>
        <div className="bg-surface-container-lowest p-3 text-center">
          <div className="font-headline text-lg font-bold text-emerald">{earned} STT</div>
          <div className="font-headline text-[10px] text-on-surface-variant/40 tracking-widest">EARNED</div>
        </div>
      </div>
    </ModalShell>
  );
}

function SettingsModal() {
  return (
    <ModalShell title="Settings">
      <div className="space-y-3 text-xs text-on-surface-variant">
        <div className="flex justify-between"><span>RPC</span><span className="text-primary">dream-rpc.somnia.network</span></div>
        <div className="flex justify-between"><span>Chain ID</span><span className="text-primary">50312</span></div>
        <div className="flex justify-between"><span>Explorer</span><span className="text-primary">shannon-explorer.somnia.network</span></div>
        <div className="flex justify-between"><span>Fairness</span><span className="text-primary">Commit-Reveal keccak256</span></div>
        <div className="flex justify-between"><span>House Edge</span><span className="text-primary">2%</span></div>
      </div>
    </ModalShell>
  );
}

function WinModal() {
  const { close } = useModal();
  const { state, resetGame } = useGame();

  return (
    <div className="fixed inset-0 z-[90] modal-backdrop flex items-center justify-center" onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div className="bg-surface-container-low border border-primary/15 w-[90vw] max-w-[420px] text-center py-8 px-6">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center">
          <span className="material-symbols-outlined text-primary mi" style={{ fontSize: 36 }}>emoji_events</span>
        </div>
        <h2 className="font-headline text-2xl font-black italic tracking-tighter text-primary mb-1">EXTRACTION SUCCESS</h2>
        <p className="text-on-surface-variant text-xs mb-6">Grid cleared. Assets secured on-chain.</p>
        <div className="flex justify-center gap-6 mb-6">
          <div>
            <div className="font-headline text-[10px] text-on-surface-variant tracking-widest mb-0.5">MULTIPLIER</div>
            <div className="font-headline text-2xl font-bold text-secondary">{state.multiplier.toFixed(2)}×</div>
          </div>
          <div className="w-px bg-outline-variant/15" />
          <div>
            <div className="font-headline text-[10px] text-on-surface-variant tracking-widest mb-0.5">PAYOUT</div>
            <div className="font-headline text-2xl font-bold text-primary">+{state.payout.toFixed(3)} STT</div>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { close(); resetGame(); }} className="flex-1 py-3 bg-gradient-to-r from-primary to-primary-container text-on-primary font-headline font-bold text-xs tracking-widest hover:brightness-110 active:scale-95">PLAY AGAIN</button>
          <button onClick={close} className="py-3 px-5 border border-outline-variant/15 text-on-surface-variant font-headline font-bold text-xs tracking-widest hover:bg-surface-container-highest">CLOSE</button>
        </div>
      </div>
    </div>
  );
}

function LoseModal() {
  const { close } = useModal();
  const { state, resetGame } = useGame();

  return (
    <div className="fixed inset-0 z-[90] modal-backdrop flex items-center justify-center" onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div className="bg-surface-container-low border border-tertiary-container/15 w-[90vw] max-w-[420px] text-center py-8 px-6">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-tertiary-container/10 border-2 border-tertiary-container flex items-center justify-center">
          <span className="material-symbols-outlined text-tertiary mi" style={{ fontSize: 36 }}>emergency</span>
        </div>
        <h2 className="font-headline text-2xl font-black italic tracking-tighter text-tertiary-container mb-1">DETONATION</h2>
        <p className="text-on-surface-variant text-xs mb-6">Mine triggered. Bet lost on-chain.</p>
        <div className="flex justify-center gap-6 mb-6">
          <div>
            <div className="font-headline text-[10px] text-on-surface-variant tracking-widest mb-0.5">CLEARED</div>
            <div className="font-headline text-2xl font-bold text-on-surface">{state.safeTiles.size}</div>
          </div>
          <div className="w-px bg-outline-variant/15" />
          <div>
            <div className="font-headline text-[10px] text-on-surface-variant tracking-widest mb-0.5">LOST</div>
            <div className="font-headline text-2xl font-bold text-error">-{state.bet.toFixed(3)} STT</div>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { close(); resetGame(); }} className="flex-1 py-3 bg-gradient-to-r from-tertiary-container to-tertiary text-on-primary font-headline font-bold text-xs tracking-widest hover:brightness-110 active:scale-95">TRY AGAIN</button>
          <button onClick={close} className="py-3 px-5 border border-outline-variant/15 text-on-surface-variant font-headline font-bold text-xs tracking-widest hover:bg-surface-container-highest">CLOSE</button>
        </div>
      </div>
    </div>
  );
}
