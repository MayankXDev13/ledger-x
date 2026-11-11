"use client";

import { TrendingUp } from "lucide-react";

/**
 * The brand half of the sign-in screen.
 *
 * The panel is the brand fill (#C2410C → #9A3412), so every label on it is
 * white or a white tint — orange-on-orange is unreadable, and the raw `slate`
 * palette this used to rely on sat at 1.9:1 against the panel.
 */
export function BrandPanel() {
  return (
    <div className="hidden lg:flex lg:flex-col lg:w-1/2 bg-gradient-brand p-12 justify-between relative overflow-hidden">
      <AnimatedBackground />
      <div className="relative z-10 flex items-center gap-3">
        <div className="w-10 h-10 bg-white/15 rounded-lg flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-white font-bold" aria-hidden="true" />
        </div>
        <span className="text-xl font-bold text-white tracking-tight">
          Ledger-X
        </span>
      </div>

      <div className="relative z-10 space-y-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/30 bg-white/10 text-white text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            Finance Intelligence Platform
          </div>

          <h1 className="text-5xl font-bold text-white leading-tight">
            Track every
            <br />
            <span className="text-brand-soft">transaction.</span>
          </h1>
          <p className="text-white/90 text-lg leading-relaxed max-w-sm">
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
              className="p-4 rounded-xl border border-white/20 bg-black/20 flex flex-col items-center justify-center"
            >
              <div className="text-2xl font-bold text-white">{value}</div>
              <div className="text-xs text-white/80 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10 text-white/80 text-sm">
        &quot;Clarity in every transaction.&quot;
      </div>
    </div>
  );
}

function AnimatedBackground() {
  return (
    <>
      <div className="absolute top-20 left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-32 right-16 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-black/10 rounded-full blur-3xl" />
    </>
  );
}
