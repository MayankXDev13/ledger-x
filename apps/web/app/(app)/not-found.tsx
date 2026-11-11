import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <FileQuestion className="w-9 h-9 text-muted-foreground" aria-hidden="true" />
      <div>
        <h1 className="text-lg font-semibold text-foreground">
          That screen does not exist
        </h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          The link may be out of date. Head back to your dashboard to carry on.
        </p>
      </div>
      <Button asChild>
        <Link href="/dashboard">Back to dashboard</Link>
      </Button>
    </div>
  );
}
