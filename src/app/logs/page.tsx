"use client";
import { useModal } from "@/hooks/useModal";
import { useState } from "react";

const EVENTS = [
  { id: "984210", b: 45, m: 3.4, w: true, mc: 5 },
  { id: "984209", b: 100, m: 0, w: false, mc: 3 },
  { id: "984208", b: 50, m: 1.85, w: true, mc: 5 },
  { id: "984207", b: 10, m: 12.5, w: true, mc: 8 },
  { id: "984206", b: 200, m: 0, w: false, mc: 5 },
  { id: "984205", b: 75, m: 2.1, w: true, mc: 3 },
  { id: "984204", b: 30, m: 5.4, w: true, mc: 8 },
  { id: "984203", b: 150, m: 0, w: false, mc: 10 },
];

export default function LogsPage() {
  const { open } = useModal();
  const [filter, setFilter] = useState<"all" | "wins" | "losses">("all");
  const tabs: Array<"all" | "wins" | "losses"> = ["all", "wins", "losses"];

  const filtered = filter === "wins" ? EVENTS.filter((e) => e.w) : filter === "losses" ? EVENTS.filter((e) => !e.w) : EVENTS;

  return (
    <div className="px-3 md:px-5 pb-8 min-h-screen">
      <div className="flex justify-between items-end mb-5 mt-2">
        <div>
          <h1 className="font-headline text-2xl md:text-3xl font-black italic tracking-tighter text-on-surface mb-0.5">COMBAT LOG</h1>
          <p className="text-[10px] text-on-surface-variant">All games verifiable on-chain.</p>
        </div>
        <div className="flex gap-1">
          {tabs.map((t) => (
            <button key={t} onClick={() => setFilter(t)} className={`px-2.5 py-1 font-headline text-[10px] font-bold tracking-widest capitalize transition-colors ${t === filter ? "bg-primary/[0.08] text-primary border border-primary/[0.12]" : "text-on-surface-variant/40 hover:text-on-surface"}`}>{t}</button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-4">
        {[
          { label: "Profit", value: "+1,244 STT", color: "text-primary" },
          { label: "Win Rate", value: "68.4%", color: "text-secondary" },
          { label: "Avg Mult", value: "2.45×", color: "text-tertiary" },
          { label: "Games", value: "128", color: "text-on-surface" },
        ].map((s) => (
          <div key={s.label} className="bg-surface-container-low p-3 border border-outline-variant/[0.06]">
            <span className="font-headline text-[10px] text-on-surface-variant/40 uppercase tracking-widest block">{s.label}</span>
            <span className={`font-headline text-base font-bold ${s.color}`}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-surface-container-low border border-outline-variant/[0.06]">
        <div className="grid grid-cols-7 px-4 py-2 border-b border-outline-variant/[0.06]">
          {["ID", "Type", "Bet", "Mult", "Result", "Time", "Verify"].map((h) => (
            <span key={h} className={`font-headline text-[10px] tracking-widest text-on-surface-variant/40 uppercase ${h === "Verify" ? "text-right" : ""}`}>{h}</span>
          ))}
        </div>

        {filtered.map((e, i) => (
          <div key={e.id} className="grid grid-cols-7 px-4 py-2.5 items-center hover:bg-surface-container/25 border-b border-outline-variant/[0.04]">
            <span className="font-headline text-[10px] text-on-surface">#{e.id}</span>
            <span className="px-1.5 py-0.5 bg-secondary/[0.06] text-secondary font-headline text-[10px] tracking-widest w-fit">MINES</span>
            <span className="font-headline text-[10px] text-on-surface">{e.b} STT</span>
            <span className="font-headline text-[10px] text-secondary">{e.m.toFixed(2)}×</span>
            <span className={`font-headline text-[10px] flex items-center gap-1 ${e.w ? "text-primary" : "text-error"}`}>
              <span className={`w-1 h-1 rounded-full ${e.w ? "bg-emerald" : "bg-error"}`} />
              {e.w ? `+${Math.floor(e.b * e.m)}` : `-${e.b}`} STT
            </span>
            <span className="font-headline text-[10px] text-on-surface-variant/30">{i + 1}m ago</span>
            <span className="text-right">
              <button onClick={() => open("fair")} className="material-symbols-outlined text-on-surface-variant/30 text-sm hover:text-primary transition-colors">verified_user</button>
            </span>
          </div>
        ))}

        <div className="flex justify-between items-center px-4 py-2.5 border-t border-outline-variant/[0.06]">
          <span className="font-headline text-[10px] text-on-surface-variant/40">1-{filtered.length} of {filtered.length}</span>
          <div className="flex gap-0.5">
            <button className="w-5 h-5 bg-primary/[0.08] border border-primary/[0.12] font-headline text-[11px] text-primary flex items-center justify-center">1</button>
          </div>
        </div>
      </div>
    </div>
  );
}
