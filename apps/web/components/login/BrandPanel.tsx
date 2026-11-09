"use client";

import { TrendingUp } from "lucide-react";

export function BrandPanel() {
  return (
    <div className="hidden lg:flex lg:flex-col lg:w-1/2 bg-gradient-brand p-12 justify-between relative overflow-hidden">
      <AnimatedBackground />
      <div className="relative z-10 flex items-center gap-3">
        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/25">
          <TrendingUp className="w-5 h-5 text-white font-bold" />
        </div>
        <span className="text-xl font-bold text-primary-foreground tracking-tight">
          Ledger-X
        </span>
      </div>

      <div className="relative z-10 space-y-6">
        <div className="space-y-3">

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/20 bg-black/20 text-orange-50 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-200 animate-pulse" />
            Finance Intelligence Platform
          </div>

          <h1 className="text-5xl font-bold text-orange-50 leading-tight">
            Track every
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-100 to-orange-200">
              transaction.
            </span>
          </h1>
          <p className="text-orange-100/70 text-lg leading-relaxed max-w-sm">
            Manage customers, track balances, and gain financial insights with
            Ledger-X.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4">
          {[
            { value: "∞", label: "Transactions" },
            { value: "0ms", label: "Latency" },
            { value: "100%", label: "Uptime" },
          ].map(({ value, label }) => (
            <div
              key={label}
              className="p-4 rounded-xl border border-white/10 bg-black/20 backdrop-blur hover:bg-black/30 transition-colors cursor-pointer flex flex-col items-center justify-center hover:scale-[1.01]"
            >
              <div className="text-2xl font-bold text-white font-mono tabular-nums">{value}</div>
              <div className="text-xs text-orange-100/60 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10 text-orange-100/60 text-sm">
        &quot;Clarity in every transaction.&quot;
      </div>
    </div>
  );
}

function AnimatedBackground() {
  return (
    <>
      <div className="absolute top-20 left-20 w-64 h-64 rounded-full blur-3xl animate-pulse bg-black/20" />
      <div className="absolute bottom-32 right-16 w-96 h-96 rounded-full blur-3xl animate-pulse delay-1000 bg-black/10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full blur-3xl bg-black/10" />
    </>
  );
}
