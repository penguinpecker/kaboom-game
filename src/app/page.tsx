"use client";
import Link from "next/link";
import { useModal } from "@/hooks/useModal";
import { GemIcon, MineIcon } from "@/components/ui/Icons";
import { randomName, randomBet, calcMultiplier } from "@/lib/utils";
import { useEffect, useState } from "react";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <StatsBar />
      <HowItWorks />
      <ReactiveModules />
      <LiveFeed />
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
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface-container-high/60 rounded-full mb-4 border border-outline-variant/[0.08] animate-fade-up" style={{ animationDelay: ".1s" }}>
          <span className="status-dot" />
          <span className="font-headline text-[10px] uppercase tracking-[.1em] text-on-surface-variant">Somnia Testnet • 6 Reactive Subs • Provably Fair</span>
        </div>
        <h1 className="font-headline text-4xl md:text-6xl font-black italic tracking-tighter text-on-surface mb-3 leading-[.9] animate-fade-up" style={{ animationDelay: ".2s" }}>
          DOMINATE <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-container">THE GRID</span>
        </h1>
        <p className="font-body text-sm text-on-surface-variant max-w-md mb-7 animate-fade-up" style={{ animationDelay: ".3s" }}>
          On-chain 4×4 Mines with autonomous reactive risk management. Commit-reveal fairness. Zero backend.
        </p>
        <HeroGrid />
        <div className="flex gap-2.5 animate-fade-up" style={{ animationDelay: ".5s" }}>
          <Link href="/play" className="px-7 py-2.5 font-headline text-sm font-black italic text-on-primary bg-gradient-to-r from-primary to-primary-container hover:scale-105 active:scale-95 transition-all hover:shadow-[0_0_20px_rgba(164,201,255,.3)]">PLAY NOW</Link>
          <button onClick={() => open("referral")} className="px-5 py-2.5 border border-outline-variant/[0.12] font-headline text-[10px] font-bold tracking-widest text-on-surface-variant hover:border-primary/25 hover:text-primary transition-all">REFER & EARN</button>
        </div>
      </div>
    </section>
  );
}

function HeroGrid() {
  const minePositions = new Set([2, 5, 13]);
  const safePositions = new Set([0, 7, 10]);
  return (
    <div className="relative mb-8 p-2 bg-surface-container-lowest/35 backdrop-blur-md rounded-xl border border-outline-variant/[0.06] animate-float animate-fade-up" style={{ animationDelay: ".4s" }}>
      <div className="grid grid-cols-4 gap-1.5 w-40 h-40 md:w-48 md:h-48">
        {Array.from({ length: 16 }, (_, i) => {
          if (minePositions.has(i)) return <div key={i} className="bg-tertiary-container/5 border border-tertiary-container/[0.12] flex items-center justify-center"><MineIcon size={12} /></div>;
          if (safePositions.has(i)) return <div key={i} className="bg-primary/[0.08] border border-primary/15 flex items-center justify-center"><GemIcon size={12} /></div>;
          return <div key={i} className="bg-surface-container-high border border-primary/5 hover:border-primary/20 transition-all" />;
        })}
      </div>
    </div>
  );
}

function StatsBar() {
  const stats = [
    { label: "Volume", value: "142.5K", color: "text-primary" },
    { label: "Games", value: "8,941", color: "text-secondary" },
    { label: "Events", value: "53.6K", color: "text-tertiary" },
    { label: "Players", value: "4,208", color: "text-emerald" },
  ];
  return (
    <section className="bg-surface-container-low border-y border-outline-variant/[0.06] py-3">
      <div className="container mx-auto px-4 flex flex-wrap justify-between items-center gap-3">
        <span className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant/40">Stats</span>
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
    { icon: "monetization_on", num: "01", title: "Set Stake", desc: "Choose bet and mine count. Dynamic limits via ReactiveRiskGuardian." },
    { icon: "grid_view", num: "02", title: "Reveal Tiles", desc: "Safe = multiplier up. Mine = game over. Each click on-chain." },
    { icon: "rocket_launch", num: "03", title: "Cash Out", desc: "Exit anytime with your multiplier. Provably fair — verify on-chain." },
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
            <h3 className="font-headline font-bold text-[10px] uppercase tracking-widest text-on-surface mb-1.5">{s.title}</h3>
            <p className="text-[10px] text-on-surface-variant leading-relaxed">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ReactiveModules() {
  const modules = [
    { icon: "shield", color: "emerald", title: "Risk Guardian", desc: "Auto-adjusts maxBet on vault changes", cat: "DeFi + Automation" },
    { icon: "emoji_events", color: "secondary", title: "Leaderboard", desc: "Auto-ranks on GameWon", cat: "Gaming" },
    { icon: "group_add", color: "primary", title: "Referral", desc: "1% auto-credit on BetPlaced", cat: "Onchain Tracker" },
    { icon: "visibility", color: "amber", title: "Whale Alert", desc: "Flags bets > 5% vault", cat: "Onchain Tracker" },
    { icon: "stream", color: "tertiary", title: "Dashboard", desc: "WebSocket off-chain Reactivity", cat: "Analytics" },
    { icon: "verified_user", color: "primary", title: "Provably Fair", desc: "Commit-reveal keccak256", cat: "Security" },
  ];
  return (
    <section className="py-12 bg-surface-container-low/50 border-y border-outline-variant/[0.06]">
      <div className="container mx-auto px-4">
        <h2 className="font-headline text-2xl font-black italic tracking-tight text-on-surface mb-2 border-l-4 border-tertiary pl-4">REACTIVE MODULES</h2>
        <p className="text-[10px] text-on-surface-variant mb-6 pl-5">6 on-chain handlers — zero backend</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
          {modules.map((m) => (
            <div key={m.title} className={`bg-surface-container p-4 border border-outline-variant/[0.06] hover:border-${m.color}/[0.12] transition-all`}>
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

function LiveFeed() {
  const [rows, setRows] = useState<Array<{ name: string; mines: number; mult: string; result: string; win: boolean; time: string }>>([]);

  useEffect(() => {
    const initial = Array.from({ length: 8 }, (_, i) => {
      const w = Math.random() > 0.35;
      const mc = [3, 5, 8, 10][Math.floor(Math.random() * 4)];
      const m = calcMultiplier(Math.floor(Math.random() * 7) + 1, mc);
      const b = randomBet();
      return { name: randomName(), mines: mc, mult: w ? `×${m.toFixed(1)}` : "×0.00", result: w ? `+${Math.floor(b * m)}` : `-${b}`, win: w, time: `${i * 3 + 2}s` };
    });
    setRows(initial);

    const interval = setInterval(() => {
      const w = Math.random() > 0.35;
      const mc = [3, 5, 8, 10][Math.floor(Math.random() * 4)];
      const m = calcMultiplier(Math.floor(Math.random() * 6) + 1, mc);
      const b = randomBet();
      const row = { name: randomName(), mines: mc, mult: w ? `×${m.toFixed(1)}` : "×0.00", result: w ? `+${Math.floor(b * m)}` : `-${b}`, win: w, time: "now" };
      setRows((prev) => [row, ...prev.slice(0, 9)]);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-12 container mx-auto px-4">
      <div className="flex justify-between items-end mb-4">
        <h2 className="font-headline text-2xl font-black italic tracking-tight text-on-surface border-l-4 border-secondary pl-4">LIVE FEED</h2>
        <div className="flex items-center gap-1"><span className="status-dot" /><span className="font-headline text-[10px] text-on-surface-variant tracking-widest">REAL-TIME</span></div>
      </div>
      <div className="bg-surface-container-low border border-outline-variant/[0.06] overflow-hidden">
        <div className="grid grid-cols-5 px-3 py-1.5 border-b border-outline-variant/[0.06]">
          {["Player", "Mines", "Mult", "Result", "Time"].map((h) => (
            <span key={h} className={`font-headline text-[10px] tracking-widest text-on-surface-variant/40 uppercase ${h === "Time" ? "text-right" : ""}`}>{h}</span>
          ))}
        </div>
        {rows.map((r, i) => (
          <div key={i} className="grid grid-cols-5 px-3 py-2 hover:bg-surface-container/25 border-b border-outline-variant/[0.04]">
            <span className="font-headline text-[10px] text-on-surface">{r.name}</span>
            <span className="font-headline text-[10px] text-on-surface-variant">{r.mines}</span>
            <span className="font-headline text-[10px] text-secondary">{r.mult}</span>
            <span className={`font-headline text-[10px] ${r.win ? "text-primary" : "text-error"}`}>{r.result}</span>
            <span className="font-headline text-[10px] text-on-surface-variant/40 text-right">{r.time}</span>
          </div>
        ))}
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
