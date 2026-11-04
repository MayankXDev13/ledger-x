"use client";

import { TrendingUp } from "lucide-react";

interface LogoSectionProps {
  title: string;
  subtitle: string;
  showLogo?: boolean;
}

export function LogoSection({
  title,
  subtitle,
  showLogo = true,
}: LogoSectionProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      {showLogo && (
        <div className="w-12 h-12 bg-gradient-brand rounded-xl flex items-center justify-center shadow-lg shadow-primary/25">
          <TrendingUp className="w-6 h-6 text-white" />
        </div>
      )}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground">{title}</h1>
        <p className="text-muted-foreground mt-1">{subtitle}</p>
      </div>
    </div>
  );
}
