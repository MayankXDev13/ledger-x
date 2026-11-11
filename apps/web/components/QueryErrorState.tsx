"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Shown when a data request fails.
 *
 * A failed request must never be presented as an empty result, so every list
 * and summary surface renders this instead of its "nothing here" state.
 */
export function QueryErrorState({
  title = "Could not load this data",
  message,
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-10 text-center"
    >
      <AlertTriangle className="w-7 h-7 text-destructive" aria-hidden="true" />
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm">
          {message ?? "Check your connection and try again."}
        </p>
      </div>
      {onRetry ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="h-9 gap-1.5 text-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
          Try again
        </Button>
      ) : null}
    </div>
  );
}
