"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount } from "wagmi";
import { useModal } from "@/hooks/useModal";
import { useState, useRef, useEffect } from "react";
import { MobileDrawer } from "./MobileDrawer";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/play", label: "Play" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/logs", label: "Logs" },
  { href: "/vault", label: "Vault" },
];

export function Navbar() {
  const pathname = usePathname();
  const { address, isConnected } = useAccount();
  const { open } = useModal();
  const [showMobile, setShowMobile] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const shortAddr = address ? `${address.slice(0, 4)}…${address.slice(-3)}` : "";

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotif(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <>
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-surface-container-low/90 backdrop-blur-xl shadow-[0_0_20px_rgba(208,188,255,0.1)]">
        <div className="flex items-center gap-8">
          <button className="lg:hidden" onClick={() => setShowMobile(true)}>
            <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 24 }}>menu</span>
          </button>
          <Link href="/" className="flex items-center gap-2">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="#60a5fa" strokeWidth="2" />
              <circle cx="12" cy="12" r="3.5" fill="#f26aff" />
              <path d="M12 3v3M12 18v3M3 12h3M18 12h3" stroke="#a4c9ff" strokeWidth="1" strokeLinecap="round" />
            </svg>
            <span className="text-2xl font-black italic tracking-tighter font-headline text-transparent bg-clip-text bg-gradient-to-br from-blue-300 to-blue-500">KABOOM!</span>
          </Link>
          <nav className="hidden lg:flex gap-6 items-center">
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <Link key={link.href} href={link.href}
                  className={`font-headline tracking-tight text-sm uppercase transition-colors ${active ? "text-primary border-b-2 border-primary pb-1" : "text-on-surface-variant hover:text-primary"}`}>
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          {isConnected && (
            <div className="flex items-center gap-2 px-4 py-1.5 bg-surface-container-highest rounded-lg border border-outline-variant/20">
              <span className="w-2 h-2 rounded-full bg-emerald" />
              <span className="font-headline text-sm font-bold text-primary tracking-wide">2,450 STT</span>
            </div>
          )}
          <button onClick={() => isConnected ? open("profile") : open("wallet")}
            className="bg-gradient-to-br from-primary to-primary-container text-on-primary px-5 py-2 font-headline text-xs font-bold uppercase tracking-widest hover:shadow-[0_0_15px_rgba(164,201,255,0.4)] transition-all active:scale-95 flex items-center gap-2">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{isConnected ? "person" : "account_balance_wallet"}</span>
            <span className="hidden sm:inline">{isConnected ? shortAddr : "Connect"}</span>
          </button>
          <div className="relative" ref={notifRef}>
            <button onClick={() => setShowNotif(!showNotif)} className="relative p-2 hover:bg-surface-container-highest rounded-lg transition-all">
              <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 22 }}>notifications</span>
              <span className="absolute top-1 right-1 w-2 h-2 bg-tertiary-container rounded-full" />
            </button>
            {showNotif && (
              <div className="absolute right-0 top-12 w-80 bg-surface-container-low border border-outline-variant/15 shadow-[0_8px_32px_rgba(0,0,0,.6)] z-50 animate-slide-down">
                <div className="px-4 py-3 border-b border-outline-variant/10 flex justify-between items-center">
                  <span className="font-headline text-xs font-bold tracking-widest uppercase text-primary">Reactive Events</span>
                  <span className="font-headline text-[10px] text-on-surface-variant">Live</span>
                </div>
                <div className="max-h-[260px] overflow-y-auto">
                  {[
                    { icon: "shield", color: "text-emerald", label: "RISK GUARDIAN", msg: "MaxBet adjusted to 482 STT — vault health 94.2%", time: "2m ago" },
                    { icon: "priority_high", color: "text-amber", label: "WHALE ALERT", msg: "Large bet 2,400 STT from 0x7a2…", time: "5m ago" },
                    { icon: "leaderboard", color: "text-secondary", label: "LEADERBOARD", msg: "SHADOW_X → #2 (115.4×)", time: "12m ago" },
                    { icon: "group", color: "text-primary", label: "REFERRAL", msg: "+4.5 STT credited from 0xf1c…", time: "18m ago" },
                  ].map((e, i) => (
                    <div key={i} className="px-4 py-3 border-b border-outline-variant/[0.05] hover:bg-surface-container/40">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`material-symbols-outlined mi ${e.color}`} style={{ fontSize: 16 }}>{e.icon}</span>
                        <span className={`font-headline text-[10px] ${e.color} tracking-widest`}>{e.label}</span>
                      </div>
                      <p className="text-xs text-on-surface-variant">{e.msg}</p>
                      <span className="font-headline text-[9px] text-on-surface-variant/40">{e.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button onClick={() => open("settings")} className="hidden lg:block p-2 hover:bg-surface-container-highest rounded-lg transition-all">
            <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 22 }}>settings</span>
          </button>
        </div>
      </header>
      {showMobile && <MobileDrawer onClose={() => setShowMobile(false)} />}
    </>
  );
}
