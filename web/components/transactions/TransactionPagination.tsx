import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
    <div className="flex items-center justify-between px-5 py-3 border-t border-border/30">
      <p className="text-xs text-muted-foreground">
        Page {page} of {totalPages} · {total} total
      </p>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="w-8 h-8"
          disabled={page === 1}
          onClick={onPrev}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="w-8 h-8"
          disabled={page === totalPages}
          onClick={onNext}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}