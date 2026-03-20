"use client";
import { randomName } from "@/lib/utils";
import { useState } from "react";

const LEADERS = [
  { r: 1, n: "OPERATOR_12", w: "12,000", m: "42.0", s: "ELITE" },
  { r: 2, n: "SHADOW_X", w: "8,450", m: "115.4", s: "ACTIVE" },
  { r: 3, n: "GHOST_CMD", w: "7,120", m: "12.5", s: "ACTIVE" },
  { r: 4, n: "KRYPTO_K", w: "5,900", m: "54.0", s: "ACTIVE" },
  { r: 5, n: "NEON_TIGER", w: "4,200", m: "8.2", s: "ACTIVE" },
  { r: 6, n: "WRAITH_99", w: "3,800", m: "6.1", s: "ACTIVE" },
  { r: 7, n: "SPECTRE_X", w: "2,900", m: "15.8", s: "ACTIVE" },
];

const LIVE_OPS = Array.from({ length: 4 }, () => ({
  name: randomName(),
  payout: Math.floor(Math.random() * 3000) + 100,
  mult: (Math.random() * 20 + 1).toFixed(1),
  time: `${Math.floor(Math.random() * 30) + 2}s`,
}));

export default function LeaderboardPage() {
  const [tab, setTab] = useState("Daily");
  const tabs = ["Daily", "Weekly", "All-Time"];

  return (
    <div className="px-3 md:px-5 pb-8 min-h-screen">
      <div className="flex justify-between items-end mb-5 mt-2">
        <div>
          <p className="font-headline text-[10px] tracking-[.12em] text-on-surface-variant flex items-center gap-1 mb-0.5">
            <span className="status-dot" />REACTIVE AUTO-RANKED
          </p>
          <h1 className="font-headline text-2xl md:text-3xl font-black italic tracking-tighter text-on-surface">
            GLOBAL <span className="text-primary">LEADERBOARD</span>
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
        {/* Table */}
        <div className="bg-surface-container-low border border-outline-variant/[0.06] stealth-card">
          <div className="flex justify-between items-center px-4 py-2.5 border-b border-outline-variant/[0.06]">
            <h2 className="font-headline text-[10px] font-bold tracking-widest text-on-surface uppercase flex items-center gap-1.5">
              <span className="material-symbols-outlined text-amber text-sm mi">emoji_events</span>Rankings
            </h2>
            <div className="flex gap-1">
              {tabs.map((t) => (
                <button key={t} onClick={() => setTab(t)} className={`px-2 py-0.5 text-[10px] font-headline font-bold tracking-widest transition-colors ${t === tab ? "bg-primary/[0.08] text-primary border border-primary/[0.12]" : "text-on-surface-variant/40 hover:text-on-surface"}`}>{t}</button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-5 px-4 py-1.5 border-b border-outline-variant/[0.06]">
            {["Rank", "Operator", "Win", "Mult", "Status"].map((h) => (
              <span key={h} className="font-headline text-[10px] tracking-widest text-on-surface-variant/40 uppercase">{h}</span>
            ))}
          </div>
          {LEADERS.map((d) => (
            <div key={d.r} className="grid grid-cols-5 px-4 py-3 items-center hover:bg-surface-container/25 border-b border-outline-variant/[0.04]">
              <span className={`w-6 h-6 rounded-full font-headline font-bold text-[10px] flex items-center justify-center ${d.r === 1 ? "bg-amber/10 text-amber" : d.r <= 3 ? "bg-on-surface-variant/[0.06] text-on-surface-variant/60" : "bg-surface-container-highest text-on-surface-variant/40"}`}>#{d.r}</span>
              <span className={`font-headline text-[10px] text-on-surface ${d.r === 1 ? "font-bold" : ""}`}>{d.n}</span>
              <span className="font-headline text-[10px] text-primary">{d.w}</span>
              <span className="font-headline text-[10px] text-secondary">{d.m}×</span>
              <span className={`px-1.5 py-0.5 font-headline text-[10px] tracking-widest w-fit ${d.s === "ELITE" ? "bg-tertiary-container/[0.08] text-tertiary" : "bg-primary/[0.06] text-primary"}`}>{d.s}</span>
            </div>
          ))}
        </div>

        {/* Sidebar */}
        <div className="space-y-3">
          <div className="bg-surface-container-low border border-outline-variant/[0.06] p-4">
            <div className="flex items-center gap-1.5 mb-2.5">
              <span className="status-dot" />
              <span className="font-headline text-[10px] font-bold tracking-widest text-on-surface uppercase">Live Wins</span>
            </div>
            <div className="space-y-2">
              {LIVE_OPS.map((op, i) => (
                <div key={i} className={`flex justify-between items-start py-1.5 ${i < 3 ? "border-b border-outline-variant/[0.04]" : ""}`}>
                  <div>
                    <div className="font-headline text-[11px] font-bold text-on-surface">{op.name}</div>
                    <div className="font-headline text-[11px] font-bold text-primary">+{op.payout} STT</div>
                  </div>
                  <div className="text-right">
                    <div className="font-headline text-[10px] text-on-surface-variant/30">{op.time}</div>
                    <span className="px-1 py-0.5 bg-secondary/[0.06] text-secondary font-headline text-[10px]">{op.mult}×</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-secondary-container/20 to-surface-container-high p-4 border border-secondary/[0.08]">
            <h3 className="font-headline text-sm font-black italic text-on-surface mb-1">STEALTH REWARDS</h3>
            <p className="text-[11px] text-on-surface-variant mb-2.5">Top 10 weekly earn bonus STT drops.</p>
            <button className="w-full py-1.5 border border-on-surface/[0.12] font-headline font-bold text-[10px] tracking-widest text-on-surface hover:bg-white/5 transition-colors">JOIN PROTOCOL</button>
          </div>
        </div>
      </div>
    </div>
  );
}
