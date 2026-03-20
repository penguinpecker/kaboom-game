"use client";
import Link from "next/link";
import { useModal } from "@/hooks/useModal";
import { useVaultBalance, useVaultHealth, useGameCounter, useWhaleAlertCount } from "@/hooks/useContracts";
import { formatEther } from "viem";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <StatsBar />
      <HowItWorks />
      <ReactiveModules />
      <SomniaBadge />
    </>
  );
}

function HeroSection() {
  const { open } = useModal();
  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden kinetic-grid">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-secondary/5 blur-[100px] rounded-full pointer-events-none" />
      <div className="container mx-auto px-4 relative z-10 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface-container-high/60 rounded-full mb-4 border border-outline-variant/[0.08]">
          <span className="status-dot" />
          <span className="font-headline text-[10px] uppercase tracking-[.1em] text-on-surface-variant">Somnia Testnet • 6 Reactive Subs • Provably Fair</span>
        </div>
        <h1 className="font-headline text-4xl md:text-6xl font-black italic tracking-tighter text-on-surface mb-3 leading-[.9]">
          DOMINATE <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-container">THE GRID</span>
        </h1>
        <p className="font-body text-sm text-on-surface-variant max-w-md mb-7">
          On-chain 4×4 Mines with autonomous reactive risk management. Commit-reveal fairness. Zero backend. Every click is a real transaction.
        </p>
        <div className="flex gap-2.5">
          <Link href="/play" className="px-7 py-2.5 font-headline text-sm font-black italic text-on-primary bg-gradient-to-r from-primary to-primary-container hover:scale-105 active:scale-95 transition-all hover:shadow-[0_0_20px_rgba(164,201,255,.3)]">PLAY NOW</Link>
          <button onClick={() => open("referral")} className="px-5 py-2.5 border border-outline-variant/[0.12] font-headline text-[10px] font-bold tracking-widest text-on-surface-variant hover:border-primary/25 hover:text-primary transition-all">REFER & EARN</button>
        </div>
      </div>
    </section>
  );
}

function StatsBar() {
  const { data: vaultBal } = useVaultBalance();
  const { data: gameCount } = useGameCounter();
  const { data: vaultHealth } = useVaultHealth();
  const { data: whaleCount } = useWhaleAlertCount();

  const stats = [
    { label: "Vault Balance", value: vaultBal ? Number(formatEther(vaultBal)).toFixed(2) + " STT" : "—", color: "text-primary" },
    { label: "Games Played", value: gameCount ? gameCount.toString() : "0", color: "text-secondary" },
    { label: "Vault Health", value: vaultHealth ? vaultHealth.toString() + "%" : "—", color: "text-emerald" },
    { label: "Whale Alerts", value: whaleCount ? whaleCount.toString() : "0", color: "text-tertiary" },
  ];

  return (
    <section className="bg-surface-container-low border-y border-outline-variant/[0.06] py-3">
      <div className="container mx-auto px-4 flex flex-wrap justify-between items-center gap-3">
        <span className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant/40">Live On-Chain</span>
        <div className="flex gap-5 md:gap-8 flex-wrap">
          {stats.map((s) => (
            <div key={s.label} className="text-right">
              <div className="font-headline text-[10px] text-on-surface-variant/40 uppercase tracking-widest">{s.label}</div>
              <div className={`font-headline text-base font-bold ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { icon: "monetization_on", num: "01", title: "Set Stake", desc: "Choose bet and mine count. Max bet auto-set by ReactiveRiskGuardian from vault health." },
    { icon: "grid_view", num: "02", title: "Reveal Tiles", desc: "Each click is an on-chain transaction. Safe = multiplier up. Mine = game over." },
    { icon: "rocket_launch", num: "03", title: "Cash Out", desc: "Exit anytime. Payout sent from vault. Provably fair — verify hash on-chain." },
  ];
  return (
    <section className="py-14 container mx-auto px-4">
      <h2 className="font-headline text-2xl font-black italic tracking-tight text-on-surface mb-8 border-l-4 border-primary pl-4">HOW IT WORKS</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {steps.map((s) => (
          <div key={s.num} className="bg-surface-container-low p-5 border border-outline-variant/[0.06] stealth-card hover:border-primary/[0.12] transition-all">
            <div className="w-9 h-9 bg-surface-container-highest rounded flex items-center justify-center mb-4 border border-primary/[0.08]">
              <span className="material-symbols-outlined text-primary mi">{s.icon}</span>
            </div>
            <div className="font-headline text-[10px] text-primary/20 tracking-widest mb-0.5">{s.num}</div>
            <h3 className="font-headline font-bold text-xs uppercase tracking-widest text-on-surface mb-1.5">{s.title}</h3>
            <p className="text-xs text-on-surface-variant leading-relaxed">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ReactiveModules() {
  const modules = [
    { icon: "shield", color: "emerald", title: "Risk Guardian", desc: "Auto-adjusts maxBet on vault changes", cat: "DeFi + Automation" },
    { icon: "emoji_events", color: "secondary", title: "Leaderboard", desc: "Auto-ranks on GameWon events", cat: "Gaming" },
    { icon: "group_add", color: "primary", title: "Referral", desc: "1% auto-credit on BetPlaced", cat: "Onchain Tracker" },
    { icon: "visibility", color: "amber", title: "Whale Alert", desc: "Flags bets > 5% vault", cat: "Onchain Tracker" },
    { icon: "stream", color: "tertiary", title: "Dashboard", desc: "WebSocket off-chain Reactivity", cat: "Analytics" },
    { icon: "verified_user", color: "primary", title: "Provably Fair", desc: "Commit-reveal keccak256", cat: "Security" },
  ];
  return (
    <section className="py-12 bg-surface-container-low/50 border-y border-outline-variant/[0.06]">
      <div className="container mx-auto px-4">
        <h2 className="font-headline text-2xl font-black italic tracking-tight text-on-surface mb-2 border-l-4 border-tertiary pl-4">REACTIVE MODULES</h2>
        <p className="text-xs text-on-surface-variant mb-6 pl-5">6 on-chain handlers — zero backend</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
          {modules.map((m) => (
            <div key={m.title} className="bg-surface-container p-4 border border-outline-variant/[0.06] hover:border-primary/10 transition-all">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className={`material-symbols-outlined text-${m.color} text-sm mi`}>{m.icon}</span>
                <span className={`font-headline font-bold text-[10px] uppercase tracking-widest text-${m.color}`}>{m.title}</span>
              </div>
              <p className="text-[11px] text-on-surface-variant">{m.desc}</p>
              <div className="mt-1.5 font-headline text-[10px] text-on-surface-variant/25 tracking-widest">{m.cat}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SomniaBadge() {
  return (
    <section className="py-6 border-t border-outline-variant/[0.06]">
      <div className="container mx-auto px-4 flex items-center justify-center gap-3 text-center flex-wrap">
        <span className="font-headline text-[11px] text-on-surface-variant/30 tracking-widest uppercase">Powered by</span>
        <span className="font-headline text-sm font-bold text-primary">Somnia Network</span>
        <span className="font-headline text-[10px] text-on-surface-variant/20">1M+ TPS • Sub-second Finality • Native Reactivity</span>
      </div>
    </section>
  );
}
