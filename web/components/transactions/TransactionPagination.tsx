import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface TransactionPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}

export function TransactionPagination({
  page,
  totalPages,
  total,
  onPrev,
  onNext,
}: TransactionPaginationProps) {
  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-border/40 bg-muted/10">
      <p className="text-[11px] text-muted-foreground">
        Showing page{" "}
        <span className="font-semibold text-foreground">{page}</span> of{" "}
        <span className="font-semibold text-foreground">{totalPages}</span>
        {" · "}
        <span className="font-semibold text-foreground">{total}</span> total
      </p>

      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "w-7 h-7 border-border/50 hover:border-cyan-500/40",
            page === 1 && "opacity-40"
          )}
          disabled={page === 1}
          onClick={onPrev}
          aria-label="Previous page"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </Button>

        {/* Page indicator */}
        <span className="text-xs font-semibold text-muted-foreground px-1 tabular">
          {page} / {totalPages}
        </span>

        <Button
          variant="outline"
          size="icon"
          className={cn(
            "w-7 h-7 border-border/50 hover:border-cyan-500/40",
            page === totalPages && "opacity-40"
          )}
          disabled={page === totalPages}
          onClick={onNext}
          aria-label="Next page"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}