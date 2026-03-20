"use client";
import { useToast } from "@/hooks/useToast";
import { useState } from "react";

const VAULT_LOG = [
  { icon: "check_circle", color: "text-emerald", msg: "Parameters nominal — maxBet at 1%", block: "4,892,104", time: "2m" },
  { icon: "warning", color: "text-amber", msg: "Whale 2,400 STT (4.9% vault) — monitoring", block: "4,892,098", time: "8m" },
  { icon: "shield", color: "text-primary", msg: "VaultBalanceChanged → limits recalculated", block: "4,892,090", time: "15m" },
  { icon: "gpp_maybe", color: "text-error", msg: "Vault at 68% — maxBet tightened to 0.5%", block: "4,891,980", time: "1h" },
];

const CONTRACTS = [
  { label: "KaboomGame", addr: "0x742d…4F2e" },
  { label: "KaboomVault", addr: "0x8B3a…9D1c" },
  { label: "RiskGuardian", addr: "0xA1F0…7E3b" },
  { label: "Leaderboard", addr: "0xC2D1…6A4f" },
  { label: "Referral", addr: "0xE3F2…8B5d" },
  { label: "WhaleAlert", addr: "0xF4A3…2C6e" },
];

export default function VaultPage() {
  const { toast } = useToast();
  const [fundAmt, setFundAmt] = useState(1000);

  return (
    <div className="px-3 md:px-5 pb-8 min-h-screen kinetic-grid">
      <div className="mb-5 mt-2">
        <p className="font-headline text-[10px] tracking-[.12em] text-on-surface-variant flex items-center gap-1 mb-0.5">
          <span className="status-dot" />VAULT STATUS: OPERATIONAL
        </p>
        <h1 className="font-headline text-2xl md:text-3xl font-black italic tracking-tighter text-on-surface">KABOOM <span className="text-primary">VAULT</span></h1>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-4">
        {[
          { label: "Balance", value: "48,250", sub: "▲ +2.4%", color: "border-primary", valColor: "text-primary", subColor: "text-emerald" },
          { label: "Max Bet", value: "482 STT", sub: "1% dynamic", color: "border-secondary", valColor: "text-secondary", subColor: "text-on-surface-variant" },
          { label: "Max Payout", value: "4,825 STT", sub: "10% cap", color: "border-tertiary", valColor: "text-tertiary", subColor: "text-on-surface-variant" },
          { label: "Health", value: "94.2%", sub: "Nominal", color: "border-emerald", valColor: "text-emerald", subColor: "text-on-surface-variant" },
        ].map((s) => (
          <div key={s.label} className={`bg-surface-container-low p-3 border border-outline-variant/[0.06] stealth-card border-l-4 ${s.color}`}>
            <div className="font-headline text-[10px] text-on-surface-variant uppercase tracking-widest">{s.label}</div>
            <div className={`font-headline text-lg font-bold ${s.valColor}`}>{s.value}</div>
            <div className={`font-headline text-[10px] ${s.subColor} mt-0.5`}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
        {/* Main vault panel */}
        <div className="bg-surface-container-low p-5 border border-outline-variant/[0.06] stealth-card">
          <h2 className="font-headline text-[10px] font-bold tracking-widest text-on-surface uppercase mb-3">Vault Health</h2>
          <div className="relative h-2.5 bg-surface-container-highest rounded-full overflow-hidden mb-2">
            <div className="absolute inset-0 h-full bg-gradient-to-r from-emerald via-primary to-primary-container rounded-full" style={{ width: "94.2%" }} />
          </div>
          <div className="flex justify-between text-[10px] font-headline text-on-surface-variant/30 tracking-widest mb-5">
            <span>0%</span><span className="text-error">EMERGENCY</span><span className="text-amber">CAUTION</span><span className="text-emerald">HEALTHY</span><span>100%</span>
          </div>

          <h3 className="font-headline text-[10px] font-bold tracking-widest text-on-surface uppercase mb-2">ReactiveRiskGuardian Log</h3>
          <div className="space-y-1">
            {VAULT_LOG.map((v, i) => (
              <div key={i} className="flex items-center gap-2.5 py-2 border-b border-outline-variant/[0.04]">
                <span className={`material-symbols-outlined ${v.color} text-sm mi shrink-0`}>{v.icon}</span>
                <div className="flex-1">
                  <div className="font-headline text-[11px] text-on-surface">{v.msg}</div>
                  <div className="font-headline text-[10px] text-on-surface-variant/25">Block #{v.block} • {v.time} ago</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-3">
          {/* Fund vault */}
          <div className="bg-surface-container-low p-4 border border-outline-variant/[0.06]">
            <h3 className="font-headline text-[10px] font-bold tracking-widest text-on-surface uppercase mb-2">Owner Actions</h3>
            <input
              type="number"
              value={fundAmt}
              onChange={(e) => setFundAmt(Number(e.target.value))}
              className="w-full bg-surface-container-lowest border-b-2 border-primary/20 focus:border-primary font-headline font-bold text-lg text-primary px-3 py-1.5 mb-2 outline-none"
            />
            <button onClick={() => { toast(`Funding vault with ${fundAmt} STT…`, "primary"); setTimeout(() => toast(`+${fundAmt} STT confirmed`, "emerald"), 2000); }} className="w-full py-2.5 bg-gradient-to-r from-primary to-primary-container text-on-primary font-headline font-bold text-[11px] tracking-widest hover:brightness-110 active:scale-95 transition-all mb-1.5">FUND VAULT</button>
            <button className="w-full py-2 border border-error/[0.12] text-error/40 font-headline font-bold text-[10px] tracking-widest hover:bg-error/5 transition-colors">EMERGENCY WITHDRAW</button>
          </div>

          {/* System info */}
          <div className="bg-surface-container-low p-4 border border-outline-variant/[0.06]">
            <h3 className="font-headline text-[10px] font-bold tracking-widest text-on-surface uppercase mb-2">System Info</h3>
            <div className="space-y-1.5 text-[11px]">
              {[
                ["Hash", "keccak256"],
                ["Fairness", "Commit-Reveal"],
                ["Edge", "2.00%"],
                ["Subs", "6 / 6"],
                ["Chain", "Somnia 50312"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-on-surface-variant/50">{k}</span>
                  <span className={`font-bold ${k === "Subs" ? "text-emerald" : "text-primary"}`}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Contracts */}
          <div className="bg-surface-container-low p-4 border border-outline-variant/[0.06]">
            <h3 className="font-headline text-[10px] font-bold tracking-widest text-on-surface uppercase mb-2">Contracts</h3>
            <div className="space-y-1.5">
              {CONTRACTS.map((c) => (
                <div key={c.label}>
                  <span className="font-headline text-[10px] text-on-surface-variant/30 block">{c.label}</span>
                  <span className="font-mono text-[10px] text-primary">{c.addr}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
