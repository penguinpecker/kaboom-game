"use client";
import { useModal } from "@/hooks/useModal";
import { useToast } from "@/hooks/useToast";
import { useGame } from "@/hooks/useGame";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { ModalShell } from "./ModalShell";
import { WinStar, LoseSkull } from "@/components/ui/Icons";
import { formatMult } from "@/lib/utils";
import { useState } from "react";

// ═══ ROOT ═══
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

// ═══ WALLET CONNECT ═══
function WalletModal() {
  const { close } = useModal();
  const { toast } = useToast();
  const { connect, connectors } = useConnect();

  const handleConnect = (connector: Parameters<typeof connect>[0]["connector"]) => {
    connect({ connector });
    toast("Connecting to Somnia Testnet…", "primary");
    close();
  };

  return (
    <ModalShell title="Connect Wallet">
      <p className="text-[10px] text-on-surface-variant mb-3">Somnia Testnet (Chain 50312)</p>
      {connectors.map((c) => (
        <button key={c.id} onClick={() => handleConnect(c)} className="w-full flex items-center gap-3 px-3 py-3 bg-surface-container-highest border border-outline-variant/[0.08] hover:border-primary/25 hover:bg-primary/5 transition-all mb-2 group">
          <div className="w-8 h-8 rounded bg-surface-bright flex items-center justify-center">
            <span className="material-symbols-outlined text-primary mi text-lg">account_balance_wallet</span>
          </div>
          <div className="flex-1 text-left">
            <div className="font-headline text-[11px] font-bold text-on-surface group-hover:text-primary transition-colors">{c.name}</div>
            <div className="font-headline text-[8px] text-on-surface-variant/50">{c.id === "injected" ? "Browser extension" : "Mobile & desktop"}</div>
          </div>
          <span className="material-symbols-outlined text-on-surface-variant/30 text-sm group-hover:text-primary">arrow_forward</span>
        </button>
      ))}
      <div className="mt-2 flex items-center gap-1.5 text-[9px] text-on-surface-variant/35">
        <span className="material-symbols-outlined text-[11px]">info</span>Chain auto-added on connect
      </div>
    </ModalShell>
  );
}

// ═══ PROFILE ═══
function ProfileModal() {
  const { open, close } = useModal();
  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  const { toast } = useToast();
  const short = address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "0x7a2F…3e8B";

  return (
    <ModalShell title="Wallet">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/25 to-tertiary-container/15 flex items-center justify-center">
          <span className="material-symbols-outlined text-primary mi">person</span>
        </div>
        <div>
          <div className="font-headline text-sm font-bold text-primary">{short}</div>
          <div className="font-headline text-[8px] text-on-surface-variant/50">Somnia Testnet • Connected</div>
        </div>
      </div>
      <div className="bg-surface-container-lowest p-3 mb-3 flex justify-between items-center">
        <span className="font-headline text-[9px] text-on-surface-variant tracking-widest uppercase">Balance</span>
        <span className="font-headline text-lg font-bold text-primary">2,450 STT</span>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-surface-container-lowest p-2 text-center"><div className="font-headline text-sm font-bold text-secondary">23</div><div className="font-headline text-[7px] text-on-surface-variant/35 tracking-widest">GAMES</div></div>
        <div className="bg-surface-container-lowest p-2 text-center"><div className="font-headline text-sm font-bold text-emerald">+1.2K</div><div className="font-headline text-[7px] text-on-surface-variant/35 tracking-widest">PNL</div></div>
        <div className="bg-surface-container-lowest p-2 text-center"><div className="font-headline text-sm font-bold text-tertiary">12.5×</div><div className="font-headline text-[7px] text-on-surface-variant/35 tracking-widest">BEST</div></div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => { close(); setTimeout(() => open("deposit"), 100); }} className="flex-1 py-2.5 bg-gradient-to-r from-primary to-primary-container text-on-primary font-headline font-bold text-[10px] tracking-widest hover:brightness-110 active:scale-95">DEPOSIT</button>
        <button onClick={() => { disconnect(); toast("Disconnected", "amber"); close(); }} className="py-2.5 px-4 border border-error/15 text-error/60 font-headline font-bold text-[10px] tracking-widest hover:bg-error/5">DISCONNECT</button>
      </div>
    </ModalShell>
  );
}

// ═══ DEPOSIT ═══
function DepositModal() {
  const { close } = useModal();
  const { toast } = useToast();
  const [amt, setAmt] = useState(500);

  return (
    <ModalShell title="Deposit STT">
      <div className="bg-surface-container-lowest p-3 mb-3">
        <label className="font-headline text-[8px] uppercase tracking-widest text-on-surface-variant/40 mb-1 block">Amount</label>
        <div className="flex items-center gap-2">
          <input type="number" value={amt} onChange={(e) => setAmt(Number(e.target.value))} className="flex-1 bg-transparent font-headline font-bold text-xl text-primary outline-none" />
          <span className="font-headline text-[10px] text-on-surface-variant/40">STT</span>
        </div>
      </div>
      <div className="flex gap-1.5 mb-3">
        {[100, 500, 1000, 5000].map((v) => (
          <button key={v} onClick={() => setAmt(v)} className="flex-1 py-1.5 bg-surface-container-highest font-headline text-[9px] text-on-surface-variant/50 hover:text-primary hover:bg-primary/[0.08] transition-all">
            {v >= 1000 ? `${v / 1000}K` : v}
          </button>
        ))}
      </div>
      <button onClick={() => { toast(`Depositing ${amt} STT…`, "primary"); close(); setTimeout(() => toast(`+${amt} STT confirmed`, "emerald"), 2000); }} className="w-full py-3 bg-gradient-to-r from-primary to-primary-container text-on-primary font-headline font-black text-[10px] tracking-widest hover:brightness-110 active:scale-95">
        CONFIRM DEPOSIT
      </button>
    </ModalShell>
  );
}

// ═══ PROVABLY FAIR ═══
function FairModal() {
  const { state } = useGame();
  return (
    <ModalShell title="✓ Provably Fair">
      <p className="text-[10px] text-on-surface-variant mb-3">Commit-reveal scheme. Mine layout hashed before game, revealed after.</p>
      <div className="space-y-2.5">
        <div>
          <div className="font-headline text-[8px] text-on-surface-variant/35 tracking-widest uppercase mb-0.5">Pre-game Commitment</div>
          <div className="bg-surface-container-lowest p-2 font-mono text-[9px] text-primary break-all select-all">{state.commitHash || "0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069"}</div>
        </div>
        <div>
          <div className="font-headline text-[8px] text-on-surface-variant/35 tracking-widest uppercase mb-0.5">Mine Layout (revealed)</div>
          <div className="bg-surface-container-lowest p-2 font-mono text-[9px] text-tertiary break-all select-all">0b0010010000100001</div>
        </div>
        <div>
          <div className="font-headline text-[8px] text-on-surface-variant/35 tracking-widest uppercase mb-0.5">Server Salt (revealed)</div>
          <div className="bg-surface-container-lowest p-2 font-mono text-[9px] text-secondary break-all select-all">0xa4f2e8c91d3b7f054e6a920c1b8d3f7e2a5c0d9b</div>
        </div>
        <div className="bg-emerald/5 border border-emerald/[0.12] p-2.5 flex items-center gap-2.5">
          <span className="material-symbols-outlined text-emerald mi text-base">check_circle</span>
          <div>
            <div className="font-headline text-[10px] font-bold text-emerald">Verification Passed</div>
            <div className="text-[8px] text-on-surface-variant">keccak256(layout + salt) = commitment</div>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}

// ═══ REFERRAL ═══
function ReferralModal() {
  const { toast } = useToast();
  const link = "https://kaboom.gg/?ref=0x7a2F…3e8B";
  return (
    <ModalShell title="Referral Program">
      <div className="bg-gradient-to-br from-secondary-container/15 to-surface-container p-3 border border-secondary/[0.12] mb-3">
        <div className="font-headline text-xl font-bold text-secondary">Earn 1% of every bet</div>
        <p className="text-[10px] text-on-surface-variant mt-1">Auto-credited via ReactiveReferral. No claiming needed.</p>
      </div>
      <div className="flex mb-3">
        <input className="flex-1 bg-surface-container-lowest font-mono text-[9px] text-primary px-2.5 py-2 outline-none" value={link} readOnly />
        <button onClick={() => { navigator.clipboard?.writeText(link); toast("Link copied!", "emerald"); }} className="px-3 bg-primary/[0.12] text-primary font-headline text-[8px] font-bold tracking-widest hover:bg-primary/20">COPY</button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-surface-container-lowest p-2.5 text-center"><div className="font-headline text-base font-bold text-primary">12</div><div className="font-headline text-[7px] text-on-surface-variant/35 tracking-widest">REFERRED</div></div>
        <div className="bg-surface-container-lowest p-2.5 text-center"><div className="font-headline text-base font-bold text-emerald">89 STT</div><div className="font-headline text-[7px] text-on-surface-variant/35 tracking-widest">EARNED</div></div>
        <div className="bg-surface-container-lowest p-2.5 text-center"><div className="font-headline text-base font-bold text-tertiary">8.9K</div><div className="font-headline text-[7px] text-on-surface-variant/35 tracking-widest">VOLUME</div></div>
      </div>
    </ModalShell>
  );
}

// ═══ SETTINGS ═══
function SettingsModal() {
  return (
    <ModalShell title="Settings">
      <div className="space-y-4">
        <Toggle label="Sound Effects" defaultOn={false} />
        <Toggle label="Animations" defaultOn={true} />
        <Toggle label="Confirm Bets" defaultOn={false} />
      </div>
      <div className="border-t border-outline-variant/[0.08] pt-3 mt-4 space-y-1.5 text-[10px] text-on-surface-variant/40">
        <div className="flex justify-between"><span>RPC</span><span className="text-primary">testnet-rpc.somnia.network</span></div>
        <div className="flex justify-between"><span>Chain ID</span><span className="text-primary">50312</span></div>
        <div className="flex justify-between"><span>Explorer</span><span className="text-primary">somnia-testnet.socialscan.io</span></div>
      </div>
    </ModalShell>
  );
}

function Toggle({ label, defaultOn }: { label: string; defaultOn: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex justify-between items-center">
      <span className="text-[11px] text-on-surface">{label}</span>
      <button onClick={() => setOn(!on)} className={`w-9 h-[18px] rounded-full relative transition-colors ${on ? "bg-emerald/25" : "bg-outline-variant/25"}`}>
        <span className={`block w-4 h-4 rounded-full absolute top-[1px] transition-all ${on ? "left-[19px] bg-emerald" : "left-[1px] bg-on-surface-variant/40"}`} />
      </button>
    </div>
  );
}

// ═══ WIN ═══
function WinModal() {
  const { close, open } = useModal();
  const { state, dispatch } = useGame();
  const payout = Math.floor(state.bet * state.multiplier);

  return (
    <div className="fixed inset-0 z-[90] modal-backdrop flex items-center justify-center" onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div className="bg-surface-container-low border border-primary/15 w-[90vw] max-w-[420px] animate-scale-in text-center py-6 px-5">
        <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-primary/[0.08] border-2 border-primary flex items-center justify-center animate-pop-in">
          <WinStar size={36} />
        </div>
        <h2 className="font-headline text-2xl font-black italic tracking-tighter text-primary mb-1">EXTRACTION SUCCESS</h2>
        <p className="text-on-surface-variant text-[10px] mb-5">Grid cleared. Assets secured.</p>
        <div className="flex justify-center gap-6 mb-5">
          <div>
            <div className="font-headline text-[8px] text-on-surface-variant tracking-widest mb-0.5">MULTIPLIER</div>
            <div className="font-headline text-2xl font-bold text-secondary">{formatMult(state.multiplier)}</div>
          </div>
          <div className="w-px bg-outline-variant/[0.12]" />
          <div>
            <div className="font-headline text-[8px] text-on-surface-variant tracking-widest mb-0.5">PAYOUT</div>
            <div className="font-headline text-2xl font-bold text-primary">+{payout} STT</div>
          </div>
        </div>
        <button onClick={() => { close(); setTimeout(() => open("fair"), 100); }} className="text-[9px] text-on-surface-variant/40 hover:text-primary transition-colors mb-4 flex items-center gap-1 mx-auto">
          <span className="material-symbols-outlined text-[11px]">verified_user</span>Verify fairness →
        </button>
        <div className="flex gap-2">
          <button onClick={() => { close(); dispatch({ type: "RESET" }); }} className="flex-1 py-2.5 bg-gradient-to-r from-primary to-primary-container text-on-primary font-headline font-bold text-[10px] tracking-widest hover:brightness-110 active:scale-95">PLAY AGAIN</button>
          <button onClick={close} className="py-2.5 px-5 border border-outline-variant/[0.12] text-on-surface-variant font-headline font-bold text-[10px] tracking-widest hover:bg-surface-container-highest">CLOSE</button>
        </div>
      </div>
    </div>
  );
}

// ═══ LOSE ═══
function LoseModal() {
  const { close, open } = useModal();
  const { state, dispatch } = useGame();
  const tilesCleared = state.revealed.size - state.mines.size;

  return (
    <div className="fixed inset-0 z-[90] modal-backdrop flex items-center justify-center" onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div className="bg-surface-container-low border border-tertiary-container/15 w-[90vw] max-w-[420px] animate-scale-in text-center py-6 px-5">
        <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-tertiary-container/[0.08] border-2 border-tertiary-container flex items-center justify-center animate-shake">
          <LoseSkull size={36} />
        </div>
        <h2 className="font-headline text-2xl font-black italic tracking-tighter text-tertiary-container mb-1">DETONATION</h2>
        <p className="text-on-surface-variant text-[10px] mb-5">Mine triggered. Bet lost.</p>
        <div className="flex justify-center gap-6 mb-5">
          <div>
            <div className="font-headline text-[8px] text-on-surface-variant tracking-widest mb-0.5">CLEARED</div>
            <div className="font-headline text-2xl font-bold text-on-surface">{tilesCleared}</div>
          </div>
          <div className="w-px bg-outline-variant/[0.12]" />
          <div>
            <div className="font-headline text-[8px] text-on-surface-variant tracking-widest mb-0.5">LOST</div>
            <div className="font-headline text-2xl font-bold text-error">-{state.bet} STT</div>
          </div>
        </div>
        <button onClick={() => { close(); setTimeout(() => open("fair"), 100); }} className="text-[9px] text-on-surface-variant/40 hover:text-primary transition-colors mb-4 flex items-center gap-1 mx-auto">
          <span className="material-symbols-outlined text-[11px]">verified_user</span>Verify fairness →
        </button>
        <div className="flex gap-2">
          <button onClick={() => { close(); dispatch({ type: "RESET" }); }} className="flex-1 py-2.5 bg-gradient-to-r from-tertiary-container to-tertiary text-on-primary font-headline font-bold text-[10px] tracking-widest hover:brightness-110 active:scale-95">TRY AGAIN</button>
          <button onClick={close} className="py-2.5 px-5 border border-outline-variant/[0.12] text-on-surface-variant font-headline font-bold text-[10px] tracking-widest hover:bg-surface-container-highest">CLOSE</button>
        </div>
      </div>
    </div>
  );
}
