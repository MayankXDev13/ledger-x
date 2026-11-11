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
      <div className="relative z-10 flex items-center gap-3">
        <div className="w-10 h-10 bg-white/15 rounded-lg flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-white font-bold" aria-hidden="true" />
        </div>
        <span className="text-xl font-bold text-white tracking-tight">
          Ledger-X
        </span>
      </div>

      <div className="relative z-10 space-y-6">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/20 bg-white/10 text-white text-xs font-medium">
            Daily khata for small shops
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight">
            Know who owes you, record entries, and collect faster.
          </h1>
          <p className="text-white/90 text-base sm:text-lg leading-relaxed max-w-sm">
            Clear balances, instant payment tracking, and timely collection right at your counter.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-2">
          {[
            { value: "0", label: "Paper slips" },
            { value: "1-Tap", label: "UPI collection" },
            { value: "Offline", label: "Ready writes" },
          ].map(({ value, label }) => (
            <div
              key={label}
              className="p-3.5 rounded-xl border border-white/15 bg-black/15 flex flex-col items-center justify-center text-center"
            >
              <div className="text-lg font-bold text-white">{value}</div>
              <div className="text-xs text-white/80 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10 text-white/80 text-sm font-medium tracking-wide">
        Built for the counter, not the boardroom
      </div>
    </div>
  );
}
