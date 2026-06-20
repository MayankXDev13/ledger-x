"use client";

import { TrendingUp } from "lucide-react";

export function BrandPanel() {
  return (
    <div className="hidden lg:flex lg:flex-col lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-12 justify-between relative overflow-hidden">
      <AnimatedBackground />
      <div className="relative z-10 flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/25">
          <TrendingUp className="w-5 h-5 text-slate-900 font-bold" />
        </div>
        <span className="text-xl font-bold text-white tracking-tight">Ledger-X</span>
      </div>

      <div className="relative z-10 space-y-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Finance Intelligence Platform
          </div>
          <h1 className="text-5xl font-bold text-white leading-tight">
            Track every<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">
              transaction.
            </span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed max-w-sm">
            Manage customers, track balances, and gain financial insights with Ledger-X.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4">
          {[
            { value: "∞", label: "Transactions" },
            { value: "0ms", label: "Latency" },
            { value: "100%", label: "Uptime" },
          ].map(({ value, label }) => (
            <div key={label} className="p-4 rounded-xl border border-slate-700/50 bg-slate-800/50 backdrop-blur">
              <div className="text-2xl font-bold text-white">{value}</div>
              <div className="text-xs text-slate-500 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10 text-slate-500 text-sm">
        &quot;Clarity in every transaction.&quot;
      </div>
    </div>
  );
}

function AnimatedBackground() {
  return (
    <>
      <div className="absolute top-20 left-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-32 right-16 w-96 h-96 bg-emerald-500/8 rounded-full blur-3xl animate-pulse delay-1000" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-400/5 rounded-full blur-3xl" />
    </>
  );
}