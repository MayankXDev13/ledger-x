"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  HandCoins,
  Sparkles,
  UserPlus,
  Wallet,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { needsOnboarding, useSettings, useUpdateSettings } from "@/hooks/useSettings";
import { useSeedSampleData } from "@/hooks/useDataPortability";

const steps = [
  {
    icon: Sparkles,
    title: "Welcome to Ledger-X",
    body: "Keep one simple book of who owes you and what you've been paid. Everything is private to your account.",
  },
  {
    icon: UserPlus,
    title: "Add your first customer",
    body: "Create a customer, then record credits (what they owe) and payments (what they've paid) against them.",
  },
  {
    icon: Wallet,
    title: "Record payments and collect",
    body: "Tag each entry with Cash or UPI, send statements, and share a UPI QR for the outstanding balance. Payments are always recorded manually.",
  },
] as const;

export function OnboardingFlow() {
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();
  const seedSample = useSeedSampleData();

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (needsOnboarding(settings)) {
      setOpen(true);
    }
  }, [settings]);

  const finish = () => {
    updateSettings.mutate(
      { onboardingCompleted: true },
      { onSuccess: () => setOpen(false) },
    );
  };

  const skip = () => {
    updateSettings.mutate(
      { onboardingDismissed: true },
      { onSuccess: () => setOpen(false) },
    );
  };

  const current = steps[step];
  const Icon = current.icon;
  const isLast = step === steps.length - 1;

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) skip();
      }}
    >
      <DialogContent className="sm:max-w-md border-border/60 bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {steps.map((_, index) => (
              <span
                key={index}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  index === step
                    ? "w-6 bg-primary"
                    : index < step
                      ? "w-1.5 bg-primary/60"
                      : "w-1.5 bg-muted",
                )}
              />
            ))}
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Step {step + 1} of {steps.length}
          </span>
        </div>

        <div className="flex flex-col items-center text-center py-3">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
            <Icon className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-lg font-bold text-foreground">
            {current.title}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-2 max-w-sm leading-relaxed">
            {current.body}
          </DialogDescription>
        </div>

        {step === 0 && (
          <div className="flex items-center justify-center gap-2 rounded-lg border border-border/60 bg-muted/20 p-3">
            <HandCoins className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-muted-foreground">
              Want to look around first?
            </span>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={() => seedSample.mutate()}
              disabled={seedSample.isPending}
            >
              Load sample data
            </Button>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 pt-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground"
            onClick={skip}
            disabled={updateSettings.isPending}
          >
            Skip for now
          </Button>

          <div className="flex items-center gap-2">
            {step > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="h-9 text-xs"
                onClick={() => setStep((value) => value - 1)}
              >
                Back
              </Button>
            )}

            {isLast ? (
              <Button
                size="sm"
                className="h-9 gap-1.5 bg-gradient-brand text-primary-foreground font-semibold text-xs"
                onClick={finish}
                disabled={updateSettings.isPending}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Finish setup
              </Button>
            ) : (
              <Button
                size="sm"
                className="h-9 gap-1.5 bg-gradient-brand text-primary-foreground font-semibold text-xs"
                onClick={() => setStep((value) => value + 1)}
              >
                Next
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>

        {isLast && (
          <p className="text-center text-[11px] text-muted-foreground">
            You can change UPI settings any time in{" "}
            <Link href="/settings" className="text-primary underline underline-offset-2">
              Settings
            </Link>
            .
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
