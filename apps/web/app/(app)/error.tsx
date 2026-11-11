"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <AlertTriangle className="w-9 h-9 text-destructive" aria-hidden="true" />
      <div>
        <h1 className="text-lg font-semibold text-foreground">
          Something went wrong on this screen
        </h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          Your ledger data was not changed. Try loading the screen again.
        </p>
      </div>
      <Button type="button" onClick={reset} className="gap-2">
        <RefreshCw className="w-4 h-4" aria-hidden="true" />
        Try again
      </Button>
    </div>
  );
}
